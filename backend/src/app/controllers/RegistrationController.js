import * as Yup from 'yup';
import { parseISO, addMonths, isBefore } from 'date-fns';
import { Op } from 'sequelize';
import Registration from '../models/Registration';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Queue from '../../lib/Queue';
import RegistrationMail from '../jobs/RegistrationMail';

class RegistrationController {
  async index(req, res) {
    const registration = await Registration.findAll();
    return res.json(registration);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;
    const checkStudent = await Student.findByPk(student_id);

    if (!checkStudent) {
      return res.status(400).json({ error: 'Student not exists' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan not exists' });
    }

    const startDate = parseISO(start_date);
    const endDate = addMonths(startDate, plan.duration);
    const price = plan.price * plan.duration;

    if (isBefore(startDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const registerExist = await Registration.findOne({
      where: {
        student_id,
        start_date: {
          [Op.lte]: startDate,
        },
        end_date: {
          [Op.gte]: startDate,
        },
      },
    });

    if (registerExist) {
      return res.status(400).json({ error: 'Student already registered' });
    }

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date: startDate,
      end_date: endDate,
      price,
    });

    const register = await Registration.findByPk(registration.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title'],
        },
      ],
    });

    await Queue.add(RegistrationMail.key, {
      register,
    });
    return res.json(registration);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number(),
      plan_id: Yup.number(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const registration = await Registration.findByPk(req.params.id);

    const { student_id, plan_id, start_date } = req.body;

    if (student_id && student_id !== registration.student_id) {
      const checkStudent = await Student.findByPk(student_id);

      if (!checkStudent) {
        return res.status(400).json({ error: 'Student not exists' });
      }
      registration.student_id = student_id;
    }

    const plan = await Plan.findByPk(plan_id || registration.plan_id);

    if (plan_id !== registration.plan_id) {
      if (!plan) {
        return res.status(400).json({ error: 'Plan not exists' });
      }
      registration.plan_id = plan_id;
    }

    registration.start_date = start_date
      ? parseISO(start_date)
      : registration.start_date;
    registration.end_date = addMonths(parseISO(start_date), plan.duration);
    registration.price = plan.price * plan.duration;

    await registration.save();
    return res.json(registration);
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id);

    if (!registration) {
      return res.statu(400).json({ error: 'Registration not exists' });
    }

    await registration.destroy();

    return res.json({ ok: true });
  }
}

export default new RegistrationController();
