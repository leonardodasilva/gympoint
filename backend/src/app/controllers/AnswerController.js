import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';

class AnswerController {
  async index(req, res) {
    const helpers = await HelpOrder.findAll({
      where: {
        answer_at: null,
      },
      attributes: ['id', 'question', 'answer', 'answer_at'],
    });

    return res.json(helpers);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const helpOrder = await HelpOrder.findByPk(req.params.helpId);
    helpOrder.answer = req.body.answer;
    helpOrder.answer_at = new Date();

    helpOrder.save();
    return res.json(helpOrder);
  }
}

export default new AnswerController();
