let BaseDao = require('../dao/baseDao');
const usersModel = require('../schema/user')
const commonDao = new BaseDao(usersModel);
const role = require('../constants').roles;
const status= require('../constants').status;
function create(data) {
    return commonDao.save(data).then((result) => {
        return result;
    })
}
function remove(query){
    return commonDao.remove(query,).then((result)=>{
        return result; 
    })
}

function findone(query){
    return commonDao.findOne(query).then((result)=>{
        return result; 
    })
}
function find(query){
    return commonDao.find(query).then((result)=>{
        return result; 
    })
}
function findOneAndUpdate(query,update,options){
    return commonDao.findOneAndUpdate(query,update,options).then((result)=>{
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