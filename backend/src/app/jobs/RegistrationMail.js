import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import formatCurrencytoBr from 'format-currency-to-br';
import Mail from '../../lib/Mail';

class RegistrationMail {
  get key() {
    return 'RegistrationMail';
  }

  async handle({ data }) {
    const { register } = data;

    await Mail.sendMail({
      to: `${register.student.name} <${register.student.email}>`,
      subject: 'Matricula Confirmada',
      template: 'registration',
      context: {
        student: register.student.name,
        studentId: register.student_id,
        plan: register.plan.title,
        price: formatCurrencytoBr(register.price),
        start_date: format(
          parseISO(register.start_date),
          "dd 'de' MMMM 'de' yyyy",
          {
            locale: pt,
          }
        ),
        end_date: format(
          parseISO(register.end_date),
          "dd 'de' MMMM 'de' yyyy",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new RegistrationMail();
