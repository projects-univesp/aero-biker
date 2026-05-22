export const handlebarsHelpers = {
  eq: (a: unknown, b: unknown) => a === b,

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

    return new Date(date)
      .getDate()
      .toString()
      .padStart(2, "0");
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

    return months[new Date(date).getMonth()];
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