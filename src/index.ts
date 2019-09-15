import Migration from './Migration'
import * as _ from 'lodash'
import * as path from 'path'
import * as fs from 'fs'
import * as recast from 'recast'
import * as prettier from 'prettier'
// import { NodePath, Visitor, ASTNode } from 'ast-types'
import { NodePath, ASTNode, Visitor, Type, builders as b } from 'ast-types'
import {
  getDbCommentFromAst,
  getMemberExpressionByName,
  getPropertyOfMemberExpressionByName,
  getVariableDeclaratorPathByIdentifierName
} from './ast'
import Model from './model'
import App from './appSpy'
import Integrate from './Integrate'
function ignoreOptions(model: any) {
  if (!model) return model
  const fieldNames = Object.keys(model)
  const newModel: plainObject = {}
  for (const fieldName of fieldNames) {
    const fieldType = model[fieldName]
    newModel[fieldName] = {
      ...fieldType,
      type: {
        ...fieldType.type,
        options: null
      }
    }
  }
  return newModel
}
type Property = recast.types.namedTypes.Property
type DeclareVariable = recast.types.namedTypes.DeclareVariable
type VariableDeclaration = recast.types.namedTypes.VariableDeclaration
type MemberExpression = recast.types.namedTypes.MemberExpression
// type NodePath=recast.types.namedTypes
// type NodePath = recast.types.namedTypes
const { writeFile } = fs.promises
import { plainObject, getComments } from './util'
~(async () => {
  const migration = new Migration({
    dir: '',
    modelKey:
      'program.body[1].expression.right.properties[0].value.body.body[1].expression.argument.arguments[1]',
    modelNameKey:
      'program.body[1].expression.right.properties[0].value.body.body[1].expression.argument.arguments[0].value'
  })
  const modelDir = ''
  const prevModel = new Model({
    dir: modelDir
  })
  await prevModel.initModel()
  prevModel.normalizeAttribute()
  await migration.initMigration()
  console.log('begin init comment')
  await migration.initComment()
  const modelFileDatas = migration.generateModelFileDatas({
    comment: true
  })
  const modelNames: string[] = migration.modelNames
  let mergeFileDatas: plainObject = {}
  // let keys = Object.keys(migration.db['company']);
  // for (const key of keys) {
  //   if (!_.isEqual(prevModel.db['company'][key], migration.db['company'][key]))
  //     console.log(
  //       'key:',
  //       key,
  //       _.isEqual(prevModel.db['company'][key], migration.db['company'][key])
  //     );
  // }
  for (const modelName of modelNames) {
    if (!_.isEqual(prevModel.db[modelName], migration.db[modelName])) {
      if (!prevModel.db[modelName]) {
        mergeFileDatas[modelName] = modelFileDatas[modelName]
      } else {
        const ast = prevModel.getModel(modelName).ast
        const a = getPropertyOfMemberExpressionByName(ast, 'define')
        const modelAst = a.parentPath.value.arguments[1]
        if (modelAst) {
          if (modelAst.type === 'Identifier') {
            const modelAstName = modelAst.name
            const variableDeclarator = getVariableDeclaratorPathByIdentifierName(ast, modelAstName)
            const modelObjectExpression = variableDeclarator.value.init
            const data = migration.getModelObjectData(modelName, {
              comment: true
            })
            const r =
              'a' +
              Math.random()
                .toString(36)
                .slice(2)
            const a = recast.parse(`let a=${r}`).program.body[0].declarations[0].init
            variableDeclarator.value.init = a
            const code = recast
              .print(ast, { tabWidth: 2, quote: 'single', reuseWhitespace: true })
              .code.replace(r, data)
            console.log('code', code)
            let output = prettier.format(code, {
              proseWrap: 'preserve',
              parser: 'babel',
              trailingComma: 'all',
              singleQuote: true
            })
            console.log('output', output)
            mergeFileDatas[modelName] = output
          } else if (modelAst.type === 'ObjectExpression') {
          }
        }
      }
    }
  }
  const migrationPaths = migration.migrationPaths
  const modifyModelNames = Object.keys(mergeFileDatas)
  // const modelNames = Object.keys(modelFileDatas);
  console.log(modifyModelNames)
  await Promise.all(
    modifyModelNames.map(async modelName => {
      const upperName = _.upperFirst(modelName)
      const modelPath = path.resolve(modelDir, upperName + '.js')
      const modelData = mergeFileDatas[modelName]
      await writeFile(modelPath, modelData)
    })
  )
})()
