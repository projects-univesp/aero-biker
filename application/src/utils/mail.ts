export function template(name: string, code: string) {
  return `
    <h3>Hello ${name}! 
    <br/> 
     <p> Here is your code to reset password. Code: ${code} </p>
    <br/> 
    <strong>Athena Devs</strong>
  `;
}