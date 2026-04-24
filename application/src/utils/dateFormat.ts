export const formatDate = () => {
  const date = new Date();
  const formmatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
  return formmatter.format(date);
};
