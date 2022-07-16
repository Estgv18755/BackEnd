var bd = require('../config/basedados');
var utilizador = require('../models/Utilizador');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

const controllers = {}

bd.sync()

//Falta garantir que o utilizador está ativo

controllers.loginGestor = async(req,res) =>{
    if(req.body.email && req.body.password){
        var email = req.body.email;
        var password = req.body.password;

        var user = await utilizador.findOne({where: {Email: email},
            include: {all: true}})
        .then(function(data){return data;})
        .catch(error =>{console.log('Error: ')+error; return error;})

        if(user){
            if(user.CargoId == 1){ //Gestor
                if(password == null || typeof password == "undefined"){
                    res.json({sucesso:false, message:'Campos em Branco'});
                }else{
                    if(req.body.email && req.body.password && user){
                        const isMatch = bcrypt.compareSync(password, user.PalavraPasse);
                        //console.log(isMatch)
                        if(req.body.email == user.Email && isMatch){
                            //console.log("Passei pela verificação")
                            let token = jwt.sign({email: req.body.email}, config.jwtSecret, {expiresIn: '1h'});
                            //console.log("token")
                            res.status(200).json({
                                sucesso: true, 
                                message:'Autenticação feita com sucesso', 
                                token: token, 
                                user: user
                            });
                        }else{
                            res.json({sucesso: false, message: 'Erro no servidor.'});
                        }    
                    }else{
                        res.json({sucesso:false, message:'Erro no servidor'})
                    }
                }
            }else{
                res.json({sucesso:false, message:'Dados de autenticação inválidos.'});
            }
        }else{
            res.json({sucesso: false, message: 'Dados de autenticação inválidos.'});
        }
    }else
        res.json({sucesso: false, message: 'Campos em branco.'});
}

controllers.loginRequesitante = async(req,res) =>{
    if(req.body.email && req.body.password){
        var email = req.body.email;
        var password = req.body.password;

        var user = await utilizador.findOne({where: {Email: email}})
        .then(function(data){return data;})
        .catch(error =>{console.log('Error: ')+error; return error;})

        if(user){
            if(user.CargoId != 1){ //Requesitante ou limpeza
                if(password == null || typeof password == "undefined"){
                    res.json({sucesso:false, message:'Campos em Branco'});
                }else{
                    if(req.body.email && req.body.password && user){
                        const isMatch = bcrypt.compareSync(password, user.PalavraPasse);
                        //console.log(isMatch)
                        if(req.body.email == user.Email && isMatch){
                            //console.log("Passei pela verificação")
                            let token = jwt.sign({email: req.body.email}, config.jwtSecret, {expiresIn: '1h'});
                            //console.log("token")
                            res.status(200).json({
                                sucesso: true, 
                                message:'Autenticação feita com sucesso', 
                                token: token, 
                                user: user,
                                id: user.id,
                                login: user.PrimeiroLogin
                            });
                        }else{
                            res.json({sucesso: false, message: 'Dados de autenticação inválidos.'});
                        }    
                    }else{
                        res.json({sucesso:false, message:'Insira uma email e uma palavra passe'})
                    }
                }
            }else{
                res.json({sucesso:false, message:'Dados de autenticação inválidos.'});
            }
        }else{
            res.json({sucesso: false, message: 'Dados de autenticação inválidos.'});
        }
    }else
        res.json({sucesso: false, message: 'Campos em branco.'});
}

module.exports = controllers