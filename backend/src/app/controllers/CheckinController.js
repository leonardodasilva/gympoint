import { Op } from 'sequelize';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import Checkin from '../models/Checkin';
import Registration from '../models/Registration';

class CheckinController {
  async store(req, res) {
    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.studentId,
        created_at: {
          [Op.between]: [
            startOfDay(addDays(new Date(), -7)),
            endOfDay(new Date()),
          ],
        },
      },
    });

    if (checkins.length >= 5) {
      return res
        .status(400)
        .json({ error: 'Student already exceeded the amount of checkins' });
    }

    const checkRegistration = await Registration.findOne({
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

    const checkin = await Checkin.create({ student_id: req.params.studentId });

    return res.json(checkin);
  }

  async index(req, res) {
    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.studentId,
      },
      order: ['created_at'],
    });
    return res.json(checkins);
  }
}

export default new CheckinController();
