let BaseDao = require('../dao/baseDao');
const eventModel = require('../schema/event')
const eventDao = new BaseDao(eventModel);
function create(data) {
    return eventDao.save(data).then((result) => {
        return result;
    })
}
function remove(query){
    return eventDao.remove(query,).then((result)=>{
        return result; 
    })
}

function findone(query){
    return eventDao.findOne(query).then((result)=>{
        return result; 
    })
}
function find(query){
    return eventDao.find(query).then((result)=>{
        return result; 
    })
}
function findOneAndUpdate(query,update,options){
    return eventDao.findOneAndUpdate(query,update,options).then((result)=>{
        return result; 
    })
}
module.exports = {
    create,
    findone,
    findOneAndUpdate,
    find,
    remove
}