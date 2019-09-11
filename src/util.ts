import { visit, types, parse } from "recast";
type Property = types.namedTypes.Property
type ObjectExpression = types.namedTypes.ObjectExpression
type Comment = types.namedTypes.Comment
export interface plainObject {
  [key: string]: any
}
/**
 * get property from object by a key that contains . or []
 * @param {string} key a key contains . or []
 * @param {plainObject} obj a object
 */
function parseObject(key: string, obj: plainObject): any {
  key = key.replace(/\.([^.[]+)/g, '[$1]')
  let index = key.indexOf('[')
  const keys = []
  if (index === -1) {
    return obj[key]
  } else {
    const firstKey = key.slice(0, index)
    let keys = key.match(/(?<=\[)(.*?)(?=\])/g)
    if (!keys) {
      throw new Error('key is not valid')
    } else {
      keys.unshift(firstKey)
    }
    let outObj: plainObject = obj
    // console.log('keys', keys)
    while (keys.length) {
      const key = keys.shift()
      outObj = outObj[key]
      if (keys.length && !outObj) {
        return null
      }
    }
    return outObj
  }
}
function getModelName(ast: any) {

}
function getComments(objectExpression: any) {
  const properties = objectExpression.properties
  return properties.map((p: any) => ({
    field: p.key.name,
    comment: getLastComment(parseComment(p.comments))
  }))
}
function parseComment(comments: Comment[] | undefined) {
  if (comments)
    return comments.map(comment => comment.value)
  return []
}
function getLastComment(comments: string[]) {
  return comments[comments.length - 1]
}
function toCode(partialAst: any) {
  const outAst = parse('')
  if (partialAst.type !== 'ExpressionStatement') {
    outAst.program.body[0] = {
      type: 'ExpressionStatement',
      expression: partialAst
    }
  }
  return partialAst
}
export { getComments, parseObject as parse }