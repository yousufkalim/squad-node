let BaseDao = require('../dao/baseDao');
const placeModel = require('../schema/places')
const placedao = new BaseDao(placeModel);
function create(data) {
    return placedao.save(data).then((result) => {
        return result;
    })
}
function remove(query){
    return placedao.remove(query,).then((result)=>{
        return result; 
    })
}

function findone(query){
    return placedao.findOne(query).then((result)=>{
        return result; 
    })
}
function find(query){
    return placedao.find(query).then((result)=>{
        return result; 
    })
}
function findOneAndUpdate(query,update,options){
    return placedao.findOneAndUpdate(query,update,options).then((result)=>{
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