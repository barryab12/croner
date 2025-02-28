import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type CronDescription = {
  expression: string;
  description: string;
  isValid: boolean;
};

export const cronScheduleTypes = {
  EVERY_MINUTE: '* * * * *',
  EVERY_HOUR: '0 * * * *',
  EVERY_DAY: '0 0 * * *',
  EVERY_WEEK: '0 0 * * 0',
  EVERY_MONTH: '0 0 1 * *',
  EVERY_YEAR: '0 0 1 1 *'
} as const;

export function describeCronExpression(expression: string): CronDescription {
  try {
    // Normaliser l'expression en retirant les secondes si présentes
    const normalizedExpression = expression.split(' ').length === 6 
      ? expression.split(' ').slice(1).join(' ')
      : expression;

    const parts = normalizedExpression.split(' ');
    
    if (parts.length !== 5) {
      return {
        expression: normalizedExpression,
        description: 'Expression cron invalide',
        isValid: false
      };
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Cas prédéfinis communs
    if (normalizedExpression === cronScheduleTypes.EVERY_MINUTE) {
      return {
        expression: normalizedExpression,
        description: "S'exécute chaque minute",
        isValid: true
      };
    }

    if (normalizedExpression === cronScheduleTypes.EVERY_HOUR) {
      return {
        expression: normalizedExpression,
        description: "S'exécute au début de chaque heure",
        isValid: true
      };
    }

    if (normalizedExpression === cronScheduleTypes.EVERY_DAY) {
      return {
        expression: normalizedExpression,
        description: "S'exécute une fois par jour à minuit",
        isValid: true
      };
    }

    if (normalizedExpression === cronScheduleTypes.EVERY_WEEK) {
      return {
        expression: normalizedExpression,
        description: "S'exécute une fois par semaine le dimanche à minuit",
        isValid: true
      };
    }

    if (normalizedExpression === cronScheduleTypes.EVERY_MONTH) {
      return {
        expression: normalizedExpression,
        description: "S'exécute le premier jour de chaque mois à minuit",
        isValid: true
      };
    }

    // Cas personnalisés
    let description = "S'exécute ";

    // Minutes
    if (minute === '*') {
      description += 'chaque minute';
    } else if (minute.includes('/')) {
      const [, freq] = minute.split('/');
      description += `toutes les ${freq} minutes`;
    } else if (minute.includes(',')) {
      description += `aux minutes: ${minute}`;
    } else {
      description += `à la minute ${minute}`;
    }

    // Heures
    if (hour !== '*') {
      if (hour.includes('/')) {
        const [, freq] = hour.split('/');
        description += `, toutes les ${freq} heures`;
      } else if (hour.includes(',')) {
        description += `, aux heures: ${hour}`;
      } else {
        description += `, à ${hour}h`;
      }
    }

    // Jours du mois
    if (dayOfMonth !== '*') {
      if (dayOfMonth === 'L') {
        description += ', le dernier jour du mois';
      } else if (dayOfMonth.includes('/')) {
        const [, freq] = dayOfMonth.split('/');
        description += `, tous les ${freq} jours du mois`;
      } else {
        description += `, le ${dayOfMonth} du mois`;
      }
    }

    // Mois
    if (month !== '*') {
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      if (month.includes('/')) {
        const [, freq] = month.split('/');
        description += `, tous les ${freq} mois`;
      } else if (month.includes(',')) {
        const months = month.split(',').map(m => monthNames[parseInt(m) - 1]);
        description += `, en ${months.join(', ')}`;
      } else {
        description += `, en ${monthNames[parseInt(month) - 1]}`;
      }
    }

    // Jours de la semaine
    if (dayOfWeek !== '*') {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      if (dayOfWeek === 'L') {
        description += ', le dernier jour de la semaine';
      } else if (dayOfWeek.includes('/')) {
        const [, freq] = dayOfWeek.split('/');
        description += `, tous les ${freq} jours de la semaine`;
      } else if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]);
        description += `, les ${days.join(', ')}`;
      } else {
        description += `, le ${dayNames[parseInt(dayOfWeek)]}`;
      }
    }

    return {
      expression: normalizedExpression,
      description,
      isValid: true
    };
  } catch {
    return {
      expression,
      description: 'Expression cron invalide',
      isValid: false
    };
  }
}

export function validateCronExpression(expression: string): boolean {
  try {
    // Normaliser l'expression
    const normalizedExpression = expression.split(' ').length === 6 
      ? expression.split(' ').slice(1).join(' ')
      : expression;

    const parts = normalizedExpression.split(' ');
    if (parts.length !== 5) return false;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Validations basiques
    const minuteValid = /^(\*|([0-9]|[1-5][0-9])(-([0-9]|[1-5][0-9]))?(,([0-9]|[1-5][0-9]))*|\*\/([0-9]|[1-5][0-9]))$/.test(minute);
    const hourValid = /^(\*|([0-9]|1[0-9]|2[0-3])(-([0-9]|1[0-9]|2[0-3]))?(,([0-9]|1[0-9]|2[0-3]))*|\*\/([0-9]|1[0-9]|2[0-3]))$/.test(hour);
    const dayOfMonthValid = /^(\*|([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?(,([1-9]|[12][0-9]|3[01]))*|\*\/([1-9]|[12][0-9]|3[01])|L)$/.test(dayOfMonth);
    const monthValid = /^(\*|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(,([1-9]|1[0-2]))*|\*\/([1-9]|1[0-2]))$/.test(month);
    const dayOfWeekValid = /^(\*|[0-6](-[0-6])?(,[0-6])*|\*\/[0-6]|L)$/.test(dayOfWeek);

    return minuteValid && hourValid && dayOfMonthValid && monthValid && dayOfWeekValid;
  } catch {
    return false;
  }
}