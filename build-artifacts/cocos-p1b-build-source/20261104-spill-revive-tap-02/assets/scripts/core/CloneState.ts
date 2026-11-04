/** Clone plain game state on hosts that do not expose the browser structuredClone API. */
export function cloneState<T>(value:T):T {
  if(typeof structuredClone==='function')return structuredClone(value);
  const seen=new Map<object,unknown>();
  const copy=(item:any):any=>{
    if(item===null||typeof item!=='object')return item;
    if(seen.has(item))return seen.get(item);
    const result:any=Array.isArray(item)?[]:{};seen.set(item,result);
    for(const key of Object.keys(item))result[key]=copy(item[key]);
    return result;
  };
  return copy(value);
}
