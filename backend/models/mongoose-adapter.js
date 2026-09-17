const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Query {
  constructor(modelName, op, query, updateData) {
    this.modelName = modelName;
    this.op = op;
    this.query = query || {};
    this.updateData = updateData;
    this.sortArg = undefined;
    this._lean = false;
  }
  
  lean() { this._lean = true; return this; }
  
  sort(arg) { this.sortArg = arg; return this; }
  
  _mapQuery(q) {
    if (!q) return {};
    let mapped = { ...q };
    if (mapped._id) { mapped.id = mapped._id; delete mapped._id; }
    
    // Handle $in, $ne, etc. if present
    for (let key in mapped) {
       if (mapped[key] && typeof mapped[key] === 'object') {
          if (mapped[key].$in) {
             mapped[key] = { in: mapped[key].$in };
          }
       }
    }
    return mapped;
  }
  
  _mapUpdate(u) {
    if (!u) return {};
    let mapped = { ...u };
    if (mapped.$set) {
       mapped = { ...mapped, ...mapped.$set };
       delete mapped.$set;
    }
    if (mapped.$setOnInsert !== undefined) {
       delete mapped.$setOnInsert;
    }
    return mapped;
  }

  async exec() {
    const delegate = prisma[this.modelName];
    const prismaQuery = { where: this._mapQuery(this.query) };
    
    if (this.sortArg) {
       prismaQuery.orderBy = Object.keys(this.sortArg).reduce((acc, key) => {
          acc[key] = this.sortArg[key] === 1 ? 'asc' : 'desc';
          return acc;
       }, {});
    }
    
    let res;
    if (this.op === 'find') res = await delegate.findMany(prismaQuery);
    else if (this.op === 'findOne') res = await delegate.findFirst(prismaQuery);
    else if (this.op === 'findById') {
       prismaQuery.where = { id: this.query };
       res = await delegate.findUnique(prismaQuery);
    }
    else if (this.op === 'updateOne') {
       const first = await delegate.findFirst(prismaQuery);
       if (first) {
          res = await delegate.update({ where: { id: first.id }, data: this._mapUpdate(this.updateData) });
       } else { res = null; }
    }
    else if (this.op === 'deleteMany') res = await delegate.deleteMany(prismaQuery);
    
    else if (this.op === 'deleteOne') {
       const first = await delegate.findFirst(prismaQuery);
       if (first) res = await delegate.delete({ where: { id: first.id } });
    }
    else if (this.op === 'findOneAndUpdate') {
       const first = await delegate.findFirst(prismaQuery);
       if (first) {
           res = await delegate.update({ where: { id: first.id }, data: this._mapUpdate(this.updateData) });
       } else if (this.updateData.$setOnInsert) {
           const createData = { ...this._mapQuery(this.query), ...this._mapUpdate(this.updateData), ...this.updateData.$setOnInsert };
           delete createData.$setOnInsert;
           res = await delegate.create({ data: createData });
       }
    }
    else if (this.op === 'countDocuments') {
       res = await delegate.count(prismaQuery);
    }
    
    const addVirtuals = (doc) => {
        if (!doc) return doc;
        if (doc.id && !doc._id) doc._id = doc.id;
        if (!this._lean && (this.op === 'findOne' || this.op === 'findById' || this.op === 'find')) {
            doc.save = async () => delegate.update({ where: { id: doc.id }, data: doc });
        }
        return doc;
    };

    if (Array.isArray(res)) res = res.map(addVirtuals);
    else if (typeof res === 'object' && res !== null) res = addVirtuals(res);
    
    return res;
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }
  
  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

function createModel(modelName) {
  const pName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  
  class Model {
    constructor(data) {
      Object.assign(this, data);
    }
    
    async save() {
       const delegate = prisma[pName];
       if (this.id) {
          return await delegate.update({ where: { id: this.id }, data: this });
       } else {
          const res = await delegate.create({ data: this });
          Object.assign(this, res);
          return this;
       }
    }
    
    static find(query) { return new Query(pName, 'find', query); }
    static findOne(query) { return new Query(pName, 'findOne', query); }
    static findById(id) { return new Query(pName, 'findById', id); }
    static updateOne(query, updateData) { return new Query(pName, 'updateOne', query, updateData); }
    static findOneAndUpdate(query, updateData, options) { 
        const q = new Query(pName, 'findOneAndUpdate', query, updateData); 
        if (options && options.upsert) {
            q.updateData = { ...updateData, $setOnInsert: options.setOnInsert || {} };
        }
        return q;
    }
    static deleteMany(query) { return new Query(pName, 'deleteMany', query); }
    static deleteOne(query) { return new Query(pName, 'deleteOne', query); }
    static countDocuments(query) { return new Query(pName, 'countDocuments', query); }
    static async insertMany(data) {
       const delegate = prisma[pName];
       return await delegate.createMany({ data });
    }
    static async create(data) {
       const delegate = prisma[pName];
       if (Array.isArray(data)) return await delegate.createMany({ data });
       return await delegate.create({ data });
    }
  }
  
  return Model;
}

const mongoose = {
  Schema: class {
    constructor(def) {
       this.Types = { Mixed: {} };
    }
  },
  model: (name, schema) => {
    return createModel(name);
  },
  connect: () => Promise.resolve(),
  Types: { Mixed: {} }
};

mongoose.Schema.Types = { Mixed: {} };

module.exports = mongoose;
