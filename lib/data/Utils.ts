export const getNestedObject = (obj: Record<any, any>, key: any): any => {
  let val = obj[key];
  if (val === undefined) {
    val = {};
    obj[key] = val;
  }

  return val;
};