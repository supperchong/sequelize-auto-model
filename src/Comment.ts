export interface dbComment {
  [tableName: string]: modelComment[]
}
export interface modelComment {
  field: string
  comment: string
}
export interface dbCommentObj {
  [tableName: string]: modelCommentObj
}
export interface modelCommentObj {
  [field: string]: string
}