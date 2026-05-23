export const handlebarsHelpers = {
  json: (context: any) => JSON.stringify(context),
  eq: (a: unknown, b: unknown) => a === b,
  ifCond: function (
    this: any,
    v1: any,
    operator: string,
    v2: any,
    options: any,
  ) {
    switch (operator) {
      case "==":
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "!=":
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case "!==":
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case "<":
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=":
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">":
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=":
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "&&":
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case "||":
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },

  formatDateShort: (date: string | Date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  },

  formatDay: (date: string | Date) => {
    if (!date) return "";

    const d = new Date(date);
    return d.getUTCDate().toString().padStart(2, "0");
  },

  formatMonthShort: (date: string | Date) => {
    if (!date) return "";

    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    return months[new Date(date).getUTCMonth()];
  },

  formatCurrency: (value: number | string) => {
    if (value === null || value === undefined || value === "") {
      return "R$ 0,00";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  },

  formatTime: (time: string) => {
    if (!time) return "";
    return String(time).substring(0, 5);
  },

  substring: (str: string, start: number, end: number) => {
    if (!str) return "";
    return str.substring(start, end);
  },

  formatDate: () => {
    const date = new Date();

    const formmatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      weekday: "long",
      year: "numeric",
    });

    return formmatter.format(date);
  },
};
