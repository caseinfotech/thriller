export function csvCell(value:string):string {
 // Prevent spreadsheet software from evaluating participant input as formulas.
 const safe=/^[\s]*[=+@-]/.test(value)||/^[\t\r\n]/.test(value)?"'"+value:value;
 return '"'+safe.replace(/"/g,'""')+'"';
}
export function signupCsv(rows:{name:string;email:string;phone:string;created_at:string}[]){return "\uFEFF"+[["Name","Email","Phone","Signed up (UTC)"],...rows.map(r=>[r.name,r.email,r.phone,r.created_at])].map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";}
