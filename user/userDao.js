let BaseDao = require('../dao/baseDao');
const usersModel = require('../schema/user')
const userdao = new BaseDao(usersModel);
function create(data) {
    return userdao.save(data).then((result) => {
        return result;
    })
}
function remove(query){
    return userdao.remove(query,).then((result)=>{
        return result; 
    })
}

function findone(query){
    return userdao.findOne(query).then((result)=>{
        return result; 
    })
}
function find(query){
    return userdao.find(query).then((result)=>{
        return result; 
    })
}
function findOneAndUpdate(query,update,options){
    return userdao.findOneAndUpdate(query,update,options).then((result)=>{
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