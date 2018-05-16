import SqliteDatabase from 'better-sqlite3'

export default class Database {
  constructor (app) {
    this.db = new SqliteDatabase('proxy.db')
    app.on('stop', this.db.close.bind(this.db))

    try {
      this.db
        .prepare(
          'CREATE TABLE Objects (key varchar(255), value varchar(255), PRIMARY KEY(key))'
        )
        .run()
    } catch (e) {
      console.log('Table already exists')
    }

    this.insert = this.db.prepare('INSERT INTO Objects VALUES(?, ?)')
    this.update = this.db.prepare('UPDATE Objects SET value = ? WHERE key = ?')
    this.select = this.db.prepare('SELECT * FROM Objects WHERE key=?')
  }

  put (key, value) {
    try {
      this.insert.run(key, value)
    } catch (e) {
      this.update.run(value, key)
    }
  }

  get (key) {
    this.select.get(key)
  }
}
