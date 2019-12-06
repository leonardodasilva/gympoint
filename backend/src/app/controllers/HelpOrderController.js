import * as Yup from 'yup';
import { Op } from 'sequelize';
import Registration from '../models/Registration';
import HelpOrder from '../models/HelpOrder';

class HelpOrderController {
  async index(req, res) {
    const helpers = await HelpOrder.findAll({
      where: {
        student_id: req.params.studentId,
      },
      attributes: ['id', 'question', 'answer', 'answer_at'],
    });

    return res.json(helpers);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const checkRegistration = await Registration.findAll({
      where: {
        student_id: req.params.studentId,
        start_date: {
          [Op.lte]: new Date(),
        },
        end_date: {
          [Op.gte]: new Date(),
        },
      },
    });

    if (!checkRegistration) {
      return res.status(400).json({ error: 'Student not registered' });
    }

    const helpOrder = await HelpOrder.create({
      student_id: req.params.studentId,
      question: req.body.question,
    });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
