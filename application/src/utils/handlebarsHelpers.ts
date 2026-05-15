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
