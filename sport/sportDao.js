let BaseDao = require('../dao/baseDao');
const sportModel = require('../schema/sport')
const sportdao = new BaseDao(sportModel);
function create(data) {
    return sportdao.save(data).then((result) => {
        return result;
    })
}
function remove(query){
    return sportdao.remove(query,).then((result)=>{
        return result; 
    })
}

function findone(query){
    return sportdao.findOne(query).then((result)=>{
        return result; 
    })
}
function find(query){
    return sportdao.find(query).then((result)=>{
        return result; 
    })
}
function findOneAndUpdate(query,update,options){
    return sportdao.findOneAndUpdate(query,update,options).then((result)=>{
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