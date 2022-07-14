var bd = require('../config/basedados');
var reserva = require('../models/Reservas');
var sala = require('../models/Salas');
var centro = require('../models/Centros');
var utilizador = require('../models/Utilizador');
var historicoLimpeza = require('../models/Historico_limpezas');
var historicoAdiamentos = require('../models/Historico_adiamentos');
const { QueryTypes } = require('sequelize');
const date = require('date-and-time')
const { Op } = require("sequelize");
const { DATE } = require('sequelize');

const controllers = {}

bd.sync()

//Listar todas as reservas
controllers.list = async (req, res) =>{
    const data = await reserva.findAll({include: {all: true}})
    .then(function(data){return data;})
    .catch(error => {
        console.log('Error:'+error)
        return error;
    })
    if(data)
        res.json({sucesso: true, data: data})
    else
        res.json({sucesso: false})
}

//Adicionar reserva

controllers.add = async (req, res) =>{
    const {NomeReserva, DataReserva, NumeroParticipantes, HoraInicio, HoraFim, Utilizador, Sala} = req.body

    var participantesLimp = NumeroParticipantes
    var Disponivel = true

    const utilizadorData = await utilizador.findOne({
        where:{id: Utilizador}
    })
    if(utilizadorData){
        if(utilizadorData.EstadoId == 1){
            const data = await sala.findOne({
                where:{id: Sala}
            })
            if(data){
                if(data.EstadoId == 1){
                    var data_reserva = new Date(DataReserva)
                    var data_atual = new Date();

                    if(date.isSameDay(data_atual,data_reserva)){

                        var horas_atuais = (data_atual.getHours()).toString()
                        console.log('Horas atuas: ' + horas_atuais)
                        var minutos_atuais = (data_atual.getMinutes()).toString()
                        console.log('Minutos atuais: ' + minutos_atuais)
                        var hora_atual_numero = Number(horas_atuais + minutos_atuais)
                        console.log('Data atual em numero: '+hora_atual_numero)

                        var TempLimpSala = data.Tempo_Limpeza
                        var tempoLimpezaArray = TempLimpSala.split(':')
                        var horaLimpeza = tempoLimpezaArray[0]
                        var minutoLimpeza = tempoLimpezaArray[1]
                        var TempoLimp = Number(horaLimpeza+minutoLimpeza);
                        console.log('Tempo limpeza da Sala: '+TempLimpSala)

                        var hora_fim_array =  HoraFim.split(':')
                        var hora_fim_numero = Number(hora_fim_array[0] + hora_fim_array[1])
                        //console.log('Hora fim: '+ hora_fim_numero)
                        var hora_fim_limpeza_numero = hora_fim_numero + TempoLimp
                        console.log('Hora fim como numero mais limpeza: '+hora_fim_limpeza_numero)

                        var hora_inicio_array =  HoraInicio.split(':')
                        var hora_incio_numero = Number(hora_inicio_array[0] + hora_inicio_array[1])
                        console.log('Hora Inicio: ' + hora_incio_numero);

                        if(hora_incio_numero < hora_fim_numero){
                            
                            if(hora_incio_numero > hora_atual_numero){

                                var participantesPermitidos = (data.Alocacao * (data.Capacidade/100));
                                if(participantesLimp > participantesPermitidos){
                                    res.json({sucesso: false, message: 'Número de participantes superior ao limite da sala.'});
                                }else{
                                    var dataCentros = await centro.findOne({
                                        where: {id: data.CentroId}
                                    })
                                    if(dataCentros){
                                        if(dataCentros.EstadoId == 1){
                                            var horaInicioCentro = dataCentros.Hora_abertura
                                            var horaInicioCentroArray = horaInicioCentro.split(':')
                                            var horaInicioCentroNumber = Number(horaInicioCentroArray[0] + horaInicioCentroArray[1])
                                            //console.log('Hora de abertura: ' + horaInicioCentroNumber
                                            var horaFimCentro = dataCentros.Hora_fecho
                                            var horaFimCentroArray = horaFimCentro.split(':')
                                            var horaFimCentroNumber = Number(horaFimCentroArray[0] + horaFimCentroArray[1])
                                            //console.log('Hora de fechar: ' + horaFimCentroNumber
                                            if((hora_incio_numero < horaInicioCentroNumber) || (hora_fim_limpeza_numero > horaFimCentroNumber)){
                                                res.json({sucesso: false, message: 'O horário do centro é entre as '+dataCentros.Hora_abertura+' e as ' + dataCentroHora_fecho+ ' !'});
                                            }else{
                                                const query = `select * from public."Reservas" where "Reservas"."EstadoId" = 1 and "Reservas"."DataReserva" = '${DataReserva}' and "Reservas"."SalaId" = ${Sala} order by "Reservas"."HoraInicio"`
                                                const reservas = await bd.query(query,{ type: QueryTypes.SELECT })
                                                //console.log(reservas.length)
                                                if(reservas.length != 0){
                                                    //Obter informacao da reserva que queremos editar
                                                    console.log(reservas)
                                                    //Hora Inicio
                                                    const horasInicioReserva = HoraInicio;
                                                    console.log('Hora da reserva desativa (formato Data): '+ horasInicioReserva)
                                                    const HoraInicio_Array = horasInicioReserva.split(':')
                                                    const horaInicio = HoraInicio_Array[0]
                                                    console.log('Hora:' + horaInicio)
                                                    const minutosInicio = HoraInicio_Array[1]
                                                    console.log('Minutos:' + minutosInicio)
                                                    const HorasInicio_desativas = Number(horaInicio+minutosInicio)
                                                    console.log('Horas da reserva desativa (formato Numero): '+HorasInicio_desativas)
                                                    //Hora Fim
                                                    const horasFimReserva = HoraFim;
                                                    console.log('Hora da reserva desativa (formato Data): '+ horasFimReserva)
                                                    const HoraFim_Array = horasFimReserva.split(':')
                                                    const horaFim = HoraFim_Array[0]
                                                    console.log('Hora:' + horaFim)
                                                    const minutosFim = HoraFim_Array[1]
                                                    console.log('Minutos:' + minutosFim)
                                                    const Horas_em_Numero = Number(horaFim+minutosFim)
                                                    console.log('Horas da reserva desativa (formato Numero): '+Horas_em_Numero)
                                                    const HorasFim_MaisLimpeza_Desativas = Horas_em_Numero + TempoLimp
                                                    console.log('Horas da reserva desativa mais limpeza (formato Numero):' + HorasFim_MaisLimpeza_Desativas)
                                                    for(let i = 0; i < reservas.length; i++){
                                                        //Reserva para comparar
                                                        //Hora inicio
                                                        const horasInicio = reservas[i].HoraInicio;
                                                        console.log('Hora da reserva ativa (formato Data): '+ horasInicio)
                                                        const horasInicio_Array = horasInicio.split(':')
                                                        const horaI = horasInicio_Array[0]
                                                        console.log('Hora:' + horaI)
                                                        const minutosI = horasInicio_Array[1]
                                                        console.log('Minutos:' + minutosI)
                                                        const HorasAtivasI = Number(horaI+minutosI)
                                                        console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasI)
                                                        //Hora Fim
                                                        const horasFim = reservas[i].HoraFim;
                                                        console.log('Hora da reserva ativa (formato Data): '+ horasFim)
                                                        const horasFim_Array = horasFim.split(':')
                                                        const horaF = horasFim_Array[0]
                                                        console.log('Hora:' + horaF)
                                                        const minutosF = horasFim_Array[1]
                                                        console.log('Minutos:' + minutosF)
                                                        const HorasAtivasF = Number(horaF+minutosF)
                                                        console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasF)
                                                        //Se comecar antes e acabar durante a reserva
                                                        if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasInicio_desativas) && (HorasAtivasF <HorasFim_MaisLimpeza_Desativas)){
                                                            console.log('Passei aqui 1')
                                                            Disponivel = false
                                                            break
                                                        }else{
                                                            //Se comecar durante a reserva e acabar depois
                                                            if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) &(HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                console.log('Passei aqui 2')
                                                                Disponivel = false
                                                                break
                                                            }else{
                                                                //Se a reserva comecar antes e acabar depois
                                                                if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                    console.log('Passei aqui 3')
                                                                    Disponivel = false
                                                                    break
                                                                }else{
                                                                    //Se a reserva comecar depois e acabar antes
                                                                    if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) &(HorasAtivasF >= HorasInicio_desativas) &&(HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                                                        console.log('Passei aqui 4')
                                                                        Disponivel = false
                                                                        break
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    //Nao sobrepoem a reserva logo pode ser ativada
                                                    if(Disponivel){
                                                        //Nao existem reservas com essa data entao pode-se dar update 
                                                        if(NomeReserva == ""){
                                                            Nome_Limpo == ""
                                                        }
                                                        else{
                                                            var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                        }
                                                        const data = await reserva.create({
                                                            NomeReserva: Nome_Limpo,
                                                            DataReserva: DataReserva,
                                                            NumeroParticipantes: participantesLimp,
                                                            HoraInicio: HoraInicio,
                                                            HoraFim: HoraFim,
                                                            EstadoId: 1,
                                                            SalaId: Sala,
                                                            UtilizadoreId: Utilizador
                                                        })
                                                        .then(function(data){return data;})
                                                        .catch(error => {
                                                            console.log('Error:'+error)
                                                            return error;
                                                        }) 
                                                        if(data)
                                                            res.status(200).json({sucesso: true,data: data, message: 'Reserva lizada com sucesso'});
                                                        else
                                                            res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                    }else{
                                                        res.json({sucesso: false, message: 'A reserva sobrepoem outra reserva'})
                                                    }
                                                }else{
                                                    //Nao existem reservas com essa data entao pode-se dar update 
                                                    if(NomeReserva == ""){
                                                        Nome_Limpo == ""
                                                    }
                                                    else{
                                                        var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                    }
                                                    const data = await reserva.create({
                                                        NomeReserva: Nome_Limpo,
                                                        DataReserva: DataReserva,
                                                        NumeroParticipantes: participantesLimp,
                                                        HoraInicio: HoraInicio,
                                                        HoraFim: HoraFim,
                                                        EstadoId: 1,
                                                        SalaId: Sala,
                                                        UtilizadoreId: Utilizador
                                                    })
                                                    .then(function(data){return data;})
                                                    .catch(error => {
                                                        console.log('Error:'+error)
                                                        return error;
                                                    }) 
                                                    if(data)
                                                        res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                    else
                                                        res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                }
                                            }
                                        }else{
                                            res.json({sucesso:false, message:'O centro esta desativado'})
                                        }
                                    }else{
                                        res.json({sucesso:false, message:'O centro nao existe'})
                                    }
                                }
                            }else{
                                res.json({sucesso:false, message:'A hora de inicio tem que ser superior a hora atual'})
                            }
                        }else{
                            res.json({sucesso:false, message:'A hora fim necessita ser superior a hora inicio'})
                        }
                    }else{
                        if(data_atual.getTime() > data_reserva.getTime())
                            res.json({sucesso: false, message: 'A data inserida esta incorreta, por favor insira uma data igual ou superior a ' + data_atual});
                        else{
                            //Reserva no futuro
                            var TempLimpSala = data.Tempo_Limpeza
                            var tempoLimpezaArray = TempLimpSala.split(':')
                            var horaLimpeza = tempoLimpezaArray[0]
                            var minutoLimpeza = tempoLimpezaArray[1]
                            var TempoLimp = Number(horaLimpeza+minutoLimpeza);
                            //console.log('Tempo limpeza: '+TempLimpSala)

                            var hora_fim_array =  HoraFim.split(':')
                            var hora_fim_numero = Number(hora_fim_array[0] + hora_fim_array[1])
                            //console.log('Hora fim: '+ hora_fim_numero)
                            var hora_fim_limpeza_numero = hora_fim_numero + TempoLimp
                            //console.log('Hora fim como numero mais limpeza: '+hora_fim_limpeza_numero)

                            var hora_inicio_array =  HoraInicio.split(':')
                            var hora_incio_numero = Number(hora_inicio_array[0] + hora_inicio_array[1])
                            //console.log('Hora Inicio: ' + hora_incio_numero);
                            if(hora_incio_numero < hora_fim_numero){
                                //Validar o numero de participantes
                                var participantesPermitidos = (data.Alocacao * (data.Capacidade/100));
                                if(participantesLimp > participantesPermitidos){
                                    res.json({sucesso: false, message: 'Número de participantes superior ao limite da sala.'});
                                }else{
                                    var dataCentros = await centro.findOne({
                                        where: {id: data.CentroId}
                                    })
                                    if(dataCentros){
                                        if(dataCentros.EstadoId == 1){
                                            var horaInicioCentro = dataCentros.Hora_abertura
                                            var horaInicioCentroArray = horaInicioCentro.split(':')
                                            var horaInicioCentroNumber = Number(horaInicioCentroArray[0] + horaInicioCentroArray[1])
                                            //console.log('Hora de abertura: ' + horaInicioCentroNumber
                                            var horaFimCentro = dataCentros.Hora_fecho
                                            var horaFimCentroArray = horaFimCentro.split(':')
                                            var horaFimCentroNumber = Number(horaFimCentroArray[0] + horaFimCentroArray[1])
                                            //console.log('Hora de fechar: ' + horaFimCentroNumber
                                            if((hora_incio_numero < horaInicioCentroNumber) || (hora_fim_limpeza_numero > horaFimCentroNumber)){
                                                res.json({sucesso: false, message: 'O horário do centro é entre as '+dataCentros.Hora_abertura+' e as ' + dataCentroHora_fecho+ ' !'});
                                            }else{
                                                const query = `select * from public."Reservas" where "Reservas"."EstadoId" = 1 and "Reservas"."DataReserva" = '${DataReserva}' and "Reservas"."SalaId" = ${Sala} order by "Reservas"."HoraInicio"`
                                                const reservas = await bd.query(query,{ type: QueryTypes.SELECT })
                                                //console.log(reservas.length)
                                                if(reservas.length != 0){
                                                    //Obter informacao da reserva que queremos editar
                                                    console.log(reservas)
                                                    //Hora Inicio
                                                    const horasInicioReserva = HoraInicio;
                                                    console.log('Hora da reserva desativa (formato Data): '+ horasInicioReserva)
                                                    const HoraInicio_Array = horasInicioReserva.split(':')
                                                    const horaInicio = HoraInicio_Array[0]
                                                    console.log('Hora:' + horaInicio)
                                                    const minutosInicio = HoraInicio_Array[1]
                                                    console.log('Minutos:' + minutosInicio)
                                                    const HorasInicio_desativas = Number(horaInicio+minutosInicio)
                                                    console.log('Horas da reserva desativa (formato Numero): '+HorasInicio_desativas)
                                                    //Hora Fim
                                                    const horasFimReserva = HoraFim;
                                                    console.log('Hora da reserva desativa (formato Data): '+ horasFimReserva)
                                                    const HoraFim_Array = horasFimReserva.split(':')
                                                    const horaFim = HoraFim_Array[0]
                                                    console.log('Hora:' + horaFim)
                                                    const minutosFim = HoraFim_Array[1]
                                                    console.log('Minutos:' + minutosFim)
                                                    const Horas_em_Numero = Number(horaFim+minutosFim)
                                                    console.log('Horas da reserva desativa (formato Numero): '+Horas_em_Numero)
                                                    const HorasFim_MaisLimpeza_Desativas = Horas_em_Numero + TempoLimp
                                                    console.log('Horas da reserva desativa mais limpeza (formato Numero):' + HorasFim_MaisLimpeza_Desativas)
                                                    for(let i = 0; i < reservas.length; i++){
                                                        //Reserva para comparar
                                                        //Hora inicio
                                                        const horasInicio = reservas[i].HoraInicio;
                                                        console.log('Hora da reserva ativa (formato Data): '+ horasInicio)
                                                        const horasInicio_Array = horasInicio.split(':')
                                                        const horaI = horasInicio_Array[0]
                                                        console.log('Hora:' + horaI)
                                                        const minutosI = horasInicio_Array[1]
                                                        console.log('Minutos:' + minutosI)
                                                        const HorasAtivasI = Number(horaI+minutosI)
                                                        console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasI)
                                                        //Hora Fim
                                                        const horasFim = reservas[i].HoraFim;
                                                        console.log('Hora da reserva ativa (formato Data): '+ horasFim)
                                                        const horasFim_Array = horasFim.split(':')
                                                        const horaF = horasFim_Array[0]
                                                        console.log('Hora:' + horaF)
                                                        const minutosF = horasFim_Array[1]
                                                        console.log('Minutos:' + minutosF)
                                                        const HorasAtivasF = Number(horaF+minutosF)
                                                        console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasF)
                                                        //Se comecar antes e acabar durante a reserva
                                                        if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasInicio_desativas) && (HorasAtivasF <HorasFim_MaisLimpeza_Desativas)){
                                                            console.log('Passei aqui 1')
                                                            Disponivel = false
                                                            break
                                                        }else{
                                                            //Se comecar durante a reserva e acabar depois
                                                            if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) &(HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                console.log('Passei aqui 2')
                                                                Disponivel = false
                                                                break
                                                            }else{
                                                                //Se a reserva comecar antes e acabar depois
                                                                if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                    console.log('Passei aqui 3')
                                                                    Disponivel = false
                                                                    break
                                                                }else{
                                                                    //Se a reserva comecar depois e acabar antes
                                                                    if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) &(HorasAtivasF >= HorasInicio_desativas) &&(HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                                                        console.log('Passei aqui 4')
                                                                        Disponivel = false
                                                                        break
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    //Nao sobrepoem a reserva logo pode ser ativada
                                                    if(Disponivel){
                                                        //Nao existem reservas com essa data entao pode-se dar update 
                                                        if(NomeReserva == ""){
                                                            Nome_Limpo == ""
                                                        }
                                                        else{
                                                            var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                        }
                                                            const data = await reserva.create({
                                                                NomeReserva: Nome_Limpo,
                                                                DataReserva: DataReserva,
                                                                NumeroParticipantes: participantesLimp,
                                                                HoraInicio: HoraInicio,
                                                                HoraFim: HoraFim,
                                                                EstadoId: 1,
                                                                SalaId: Sala,
                                                                UtilizadoreId: Utilizador
                                                            })
                                                            .then(function(data){return data;})
                                                            .catch(error => {
                                                                console.log('Error:'+error)
                                                                return error;
                                                            }) 
                                                            if(data)
                                                                res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                            else
                                                                res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                    }else{
                                                        res.json({sucesso: false, message: 'A reserva sobrepoem outra reserva'})
                                                    }
                                                }else{
                                                    if(NomeReserva == ""){
                                                        Nome_Limpo == ""
                                                    }
                                                    else{
                                                        var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                    }
                                                    const data = await reserva.create({
                                                        NomeReserva: Nome_Limpo,
                                                        DataReserva: DataReserva,
                                                        NumeroParticipantes: participantesLimp,
                                                        HoraInicio: HoraInicio,
                                                        HoraFim: HoraFim,
                                                        EstadoId: 1,
                                                        SalaId: Sala,
                                                        UtilizadoreId: Utilizador
                                                    })
                                                    .then(function(data){return data;})
                                                    .catch(error => {
                                                        console.log('Error:'+error)
                                                        return error;
                                                    }) 
                                                    if(data)
                                                        res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                    else
                                                        res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                }
                                            }
                                        }else{
                                            res.json({sucesso:false, message:'O centro esta desativado'})
                                        }
                                    }else{
                                        res.json({sucesso:false, message:'O centro nao existe'})
                                    }
                                }
                            }else{
                                res.json({sucesso:false, message:'A hora final tem que ser superior a hora inicio'})
                            }
                        }
                    }
                }else{
                    res.json({sucesso:false, message:'A sala esta desativada'})
                }
            }else{
                res.json({sucesso:false, message:'A sala escolhida nao existe'})
            }
        }else{
            res.json({sucesso:false, message:'O utilizador esta desativado'})
        }
    }else{
        res.json({sucesso:false, message:'O utilizador nao existe'})
    }
}

//Obter reserva

controllers.get = async(req,res) =>{

    const {id} = req.params;
    const data = await reserva.findOne({
        where: {id: id},
        include: {all: true}
    })
    .then(function(data){return data;})
    .catch(error => {
        console.log('Error:'+error)
        return error;
    })
    if(data)
        res.status(200).json({sucesso: true, data: data});
    else
        res.json({sucesso: false, message:'Nao foi possivel obter a reserva com o id: ' + id});
}

//Editar reserva

controllers.update = async (req, res) =>{ 
    const {id} = req.params;
    const {NomeReserva, DataReserva, NumeroParticipantes, HoraInicio, HoraFim, Utilizador, Sala} = req.body
    var ParticipantesArray = NumeroParticipantes.split(',')
    console.log(ParticipantesArray)
    var participantesLimp = Number(ParticipantesArray[0])
    console.log(participantesLimp)
    var Disponivel = true

    const reservaData = await reserva.findOne({
        where:{id:id}
    })
    if(reservaData){
        if(reservaData.EstadoId == 1){
            const utilizadorData = await utilizador.findOne({
            where:{id: Utilizador}
            })
            if(utilizadorData){
                if(utilizadorData.EstadoId == 1){
                    const data = await sala.findOne({
                        where:{id: Sala}
                    })
                    if(data){
                        if(data.EstadoId == 1){
                            var data_reserva = new Date(DataReserva)
                            var data_atual = new Date();
                            if(date.isSameDay(data_atual,data_reserva)){
                                var horas_atuais = (data_atual.getHours()).toString()
                                //console.log('Horas atuas: ' + horas_atuais)
                                var minutos_atuais = (data_atual.getMinutes()).toString()
                                //console.log('Minutos atuais: ' + minutos_atuais)
                                var hora_atual_numero = Number(horas_atuais + minutos_atuais)
                                //console.log('Data atual em numero: '+hora_atual_numero)
                                var TempLimpSala = data.Tempo_Limpeza
                                var tempoLimpezaArray = TempLimpSala.split(':')
                                var horaLimpeza = tempoLimpezaArray[0]
                                var minutoLimpeza = tempoLimpezaArray[1]
                                var TempoLimp = Number(horaLimpeza+minutoLimpeza);
                                //console.log('Tempo limpeza da Sala: '+TempLimpSala)

                                var hora_fim_array =  HoraFim.split(':')
                                var hora_fim_numero = Number(hora_fim_array[0] + hora_fim_array[1])
                                //console.log('Hora fim: '+ hora_fim_numero)
                                var hora_fim_limpeza_numero = hora_fim_numero + TempoLimp
                                //console.log('Hora fim como numero mais limpeza: '+hora_fim_limpeza_numero)

                                var hora_inicio_array =  HoraInicio.split(':')
                                var hora_incio_numero = Number(hora_inicio_array[0] + hora_inicio_array[1])
                                console.log('Hora Inicio: ' + hora_incio_numero);
                                if(hora_incio_numero < hora_fim_numero){
                                    //Validar se a hora inicio da reserva
                                    if(hora_incio_numero > hora_atual_numero){
                                        var participantesPermitidos = (data.Alocacao * (data.Capacidade/100));
                                        if(participantesLimp > participantesPermitidos){
                                            res.json({sucesso: false, message: 'Número de participantes superior ao limite da sala.'});
                                        }else{
                                            var dataCentros = await centro.findOne({
                                                where: {id: data.CentroId}
                                            })
                                            if(dataCentros){
                                                if(dataCentros.EstadoId == 1){
                                                    var horaInicioCentro = dataCentros.Hora_abertura
                                                    var horaInicioCentroArray = horaInicioCentro.split(':')
                                                    var horaInicioCentroNumber = Number(horaInicioCentroArray[0] + horaInicioCentroArray[1])
                                                    //console.log('Hora de abertura: ' + horaInicioCentroNumber)

                                                    var horaFimCentro = dataCentros.Hora_fecho
                                                    var horaFimCentroArray = horaFimCentro.split(':')
                                                    var horaFimCentroNumber = Number(horaFimCentroArray[0] + horaFimCentroArray[1])
                                                    //console.log('Hora de fechar: ' + horaFimCentroNumber)

                                                    if((hora_incio_numero < horaInicioCentroNumber) || (hora_fim_limpeza_numero > horaFimCentroNumber)){
                                                        res.json({sucesso: false, message: 'O horário do centro é entre as '+dataCentros.Hora_abertura+' e as ' + dataCentros.Hora_fecho+ ' !'});
                                                    }else{
                                                        const query = `select * from public."Reservas" where "Reservas"."EstadoId" = 1 and "Reservas"."DataReserva" = '${DataReserva}' and "Reservas"."SalaId" = ${Sala} and "Reservas"."id" != ${id} order by "Reservas"."HoraInicio"`
                                                        const reservas = await bd.query(query,{ type: QueryTypes.SELECT })
                                                        //console.log(reservas.length)
                                                        if(reservas.length != 0){
                                                            //Obter informacao da reserva que queremos editar
                                                            console.log(reservas)
                                                            //Hora Inicio
                                                            const horasInicioReserva = reservaData.HoraInicio;
                                                            console.log('Hora da reserva desativa (formato Data): '+ horasInicioReserva)
                                                            const HoraInicio_Array = horasInicioReserva.split(':')
                                                            const horaInicio = HoraInicio_Array[0]
                                                            console.log('Hora:' + horaInicio)
                                                            const minutosInicio = HoraInicio_Array[1]
                                                            console.log('Minutos:' + minutosInicio)
                                                            const HorasInicio_desativas = Number(horaInicio+minutosInicio)
                                                            console.log('Horas da reserva desativa (formato Numero): '+HorasInicio_desativas)

                                                            //Hora Fim
                                                            const horasFimReserva = reservaData.HoraFim;
                                                            console.log('Hora da reserva desativa (formato Data): '+ horasFimReserva)
                                                            const HoraFim_Array = horasFimReserva.split(':')
                                                            const horaFim = HoraFim_Array[0]
                                                            console.log('Hora:' + horaFim)
                                                            const minutosFim = HoraFim_Array[1]
                                                            console.log('Minutos:' + minutosFim)
                                                            const Horas_em_Numero = Number(horaFim+minutosFim)
                                                            console.log('Horas da reserva desativa (formato Numero): '+Horas_em_Numero)
                                                            const HorasFim_MaisLimpeza_Desativas = Horas_em_Numero + TempoLimp
                                                            console.log('Horas da reserva desativa mais limpeza (formato Numero):' + HorasFim_MaisLimpeza_Desativas)

                                                            for(let i = 0; i < reservas.length; i++){
                                                                //Reserva para comparar
                                                                //Hora inicio
                                                                const horasInicio = reservas[i].HoraInicio;
                                                                console.log('Hora da reserva ativa (formato Data): '+ horasInicio)
                                                                const horasInicio_Array = horasInicio.split(':')
                                                                const horaI = horasInicio_Array[0]
                                                                console.log('Hora:' + horaI)
                                                                const minutosI = horasInicio_Array[1]
                                                                console.log('Minutos:' + minutosI)
                                                                const HorasAtivasI = Number(horaI+minutosI)
                                                                console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasI)
                                                                //Hora Fim
                                                                const horasFim = reservas[i].HoraFim;
                                                                console.log('Hora da reserva ativa (formato Data): '+ horasFim)
                                                                const horasFim_Array = horasFim.split(':')
                                                                const horaF = horasFim_Array[0]
                                                                console.log('Hora:' + horaF)
                                                                const minutosF = horasFim_Array[1]
                                                                console.log('Minutos:' + minutosF)
                                                                const HorasAtivasF = Number(horaF+minutosF)
                                                                console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasF)

                                                                //Se comecar antes e acabar durante a reserva
                                                                if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasInicio_desativas) && (HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                                                    console.log('Passei aqui 1')
                                                                    Disponivel = false
                                                                    break
                                                                }else{
                                                                    //Se comecar durante a reserva e acabar depois
                                                                    if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                        console.log('Passei aqui 2')
                                                                        Disponivel = false
                                                                        break
                                                                    }else{
                                                                        //Se a reserva comecar antes e acabar depois
                                                                        if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                            console.log('Passei aqui 3')
                                                                            Disponivel = false
                                                                            break
                                                                        }else{
                                                                            //Se a reserva comecar depois e acabar antes
                                                                            if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) && (HorasAtivasF >= HorasInicio_desativas) &&(HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                                                                console.log('Passei aqui 4')
                                                                                Disponivel = false
                                                                                break
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            //Nao sobrepoem a reserva logo pode ser ativada
                                                            if(Disponivel){
                                                                //Nao existem reservas com essa data entao pode-se dar update 
                                                                var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                                const data = await reserva.update({
                                                                    NomeReserva: Nome_Limpo,
                                                                    DataReserva: DataReserva,
                                                                    NumeroParticipantes: participantesLimp,
                                                                    HoraInicio: HoraInicio,
                                                                    HoraFim: HoraFim
                                                                }, {where: {id: id}})
                                                                .then(function(data){return data;})
                                                                .catch(error => {
                                                                    console.log('Error:'+error)
                                                                    return error;
                                                                }) 
                                                                if(data)
                                                                    res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                                else
                                                                    res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                            }else{
                                                                res.json({sucesso: false, message: 'A reserva sobrepoem outra reserva'})
                                                            }
                                                        }else{
                                                            //Nao existem reservas com essa data entao pode-se dar update 
                                                            var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                            const data = await reserva.update({
                                                                NomeReserva: Nome_Limpo,
                                                                DataReserva: DataReserva,
                                                                NumeroParticipantes: participantesLimp,
                                                                HoraInicio: HoraInicio,
                                                                HoraFim: HoraFim
                                                            }, {where: {id: id}})
                                                            .then(function(data){return data;})
                                                            .catch(error => {
                                                                console.log('Error:'+error)
                                                                return error;
                                                            }) 
                                                            if(data)
                                                                res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                            else
                                                                res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                        }
                                                        //-------
                                                    }
                                                }else{
                                                    res.json({sucesso:false, message:'O centro esta desativado'})
                                                }
                                            }else{
                                                res.json({sucesso:false, message:'O centro nao existe'})
                                            }
                                        }
                                    }else{
                                        res.json({sucesso:false, message:'A hora de inicio tem que ser superior a hora atual'})
                                    }
                                }else{
                                    res.json({sucesso:false, message:'A hora fim necessita ser superior a hora inicio'})
                                }
                            }else{
                                if(data_atual.getTime() > data_reserva.getTime())
                                    res.json({sucesso: false, message: 'A data inserida esta incorreta, por favor insira uma data igual ou superior a ' + data_atual});
                                else{
                                    //Reserva no futuro
                                    var TempLimpSala = data.Tempo_Limpeza
                                    var tempoLimpezaArray = TempLimpSala.split(':')
                                    var horaLimpeza = tempoLimpezaArray[0]
                                    var minutoLimpeza = tempoLimpezaArray[1]
                                    var TempoLimp = Number(horaLimpeza+minutoLimpeza);
                                    //console.log('Tempo limpeza: '+TempLimpSala)

                                    var hora_fim_array =  HoraFim.split(':')
                                    var hora_fim_numero = Number(hora_fim_array[0] + hora_fim_array[1])
                                    //console.log('Hora fim: '+ hora_fim_numero)
                                    var hora_fim_limpeza_numero = hora_fim_numero + TempoLimp
                                    //console.log('Hora fim como numero mais limpeza: '+hora_fim_limpeza_numero)

                                    var hora_inicio_array =  HoraInicio.split(':')
                                    var hora_incio_numero = Number(hora_inicio_array[0] + hora_inicio_array[1])
                                    //console.log('Hora Inicio: ' + hora_incio_numero);
                                    if(hora_incio_numero < hora_fim_numero){
                                        //Validar o numero de participantes
                                        var participantesPermitidos = (data.Alocacao * (data.Capacidade/100));
                                        if(participantesLimp > participantesPermitidos){
                                            res.json({sucesso: false, message: 'Número de participantes superior ao limite da sala.'});
                                        }else{
                                            var dataCentros = await centro.findOne({
                                                where: {id: data.CentroId}
                                            })
                                            if(dataCentros){
                                                if(dataCentros.EstadoId == 1){
                                                    var horaInicioCentro = dataCentros.Hora_abertura
                                                    var horaInicioCentroArray = horaInicioCentro.split(':')
                                                    var horaInicioCentroNumber = Number(horaInicioCentroArray[0] + horaInicioCentroArray[1])
                                                    //console.log('Hora de abertura: ' + horaInicioCentroNumber)

                                                    var horaFimCentro = dataCentros.Hora_fecho
                                                    var horaFimCentroArray = horaFimCentro.split(':')
                                                    var horaFimCentroNumber = Number(horaFimCentroArray[0] + horaFimCentroArray[1])
                                                    //console.log('Hora de fechar: ' + horaFimCentroNumber)

                                                    if((hora_incio_numero < horaInicioCentroNumber) || (hora_fim_limpeza_numero > horaFimCentroNumber)){
                                                        res.json({sucesso: false, message: 'O horário do centro é entre as '+dataCentros.Hora_abertura+' e as ' + dataCentros.Hora_fecho+ ' !'});
                                                    }else{
                                                        const query = `select * from public."Reservas" where "Reservas"."EstadoId" = 1 and "Reservas"."DataReserva" = '${DataReserva}' and "Reservas"."SalaId" = ${Sala} and "Reservas"."id" != ${id} order by "Reservas"."HoraInicio"`
                                                        const reservas = await bd.query(query,{ type: QueryTypes.SELECT })
                                                        //console.log(reservas.length)
                                                        if(reservas.length != 0){
                                                            //Obter informacao da reserva que queremos ativar
                                                            //console.log(reservas)
                                                            //Hora Inicio
                                                            const horasInicioReserva = reservaData.HoraInicio;
                                                            //console.log('Hora da reserva desativa (formato Data): '+ horasInicioReserva)
                                                            const HoraInicio_Array = horasInicioReserva.split(':')
                                                            const horaInicio = HoraInicio_Array[0]
                                                            //console.log('Hora:' + horaInicio)
                                                            const minutosInicio = HoraInicio_Array[1]
                                                            //console.log('Minutos:' + minutosInicio)
                                                            const HorasInicio_desativas = Number(horaInicio+minutosInicio)
                                                            //console.log('Horas da reserva desativa (formato Numero): '+HorasInicio_desativas)

                                                            //Hora Fim
                                                            const horasFimReserva = reservaData.HoraFim;
                                                            //console.log('Hora da reserva desativa (formato Data): '+ horasFimReserva)
                                                            const HoraFim_Array = horasFimReserva.split(':')
                                                            const horaFim = HoraFim_Array[0]
                                                            //console.log('Hora:' + horaFim)
                                                            const minutosFim = HoraFim_Array[1]
                                                            //console.log('Minutos:' + minutosFim)
                                                            const Horas_em_Numero = Number(horaFim+minutosFim)
                                                            //console.log('Horas da reserva desativa (formato Numero): '+Horas_em_Numero)
                                                            const HorasFim_MaisLimpeza_Desativas = Horas_em_Numero + TempoLimp
                                                            //console.log('Horas da reserva desativa mais limpeza (formato Numero):' + HorasFim_MaisLimpeza_Desativas)

                                                            for(let i = 0; i < reservas.length; i++){
                                                                //Reserva para comparar
                                                                //Hora inicio
                                                                const horasInicio = reservas[i].HoraInicio;
                                                                //console.log('Hora da reserva ativa (formato Data): '+ horasInicio)
                                                                const horasInicio_Array = horasInicio.split(':')
                                                                const horaI = horasInicio_Array[0]
                                                                //console.log('Hora:' + horaI)
                                                                const minutosI = horasInicio_Array[1]
                                                                //console.log('Minutos:' + minutosI)
                                                                const HorasAtivasI = Number(horaI+minutosI)
                                                                //console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasI)
                                                                //Hora Fim
                                                                const horasFim = reservas[i].HoraFim;
                                                                //console.log('Hora da reserva ativa (formato Data): '+ horasFim)
                                                                const horasFim_Array = horasFim.split(':')
                                                                const horaF = horasFim_Array[0]
                                                                //console.log('Hora:' + horaF)
                                                                const minutosF = horasFim_Array[1]
                                                                //console.log('Minutos:' + minutosF)
                                                                const HorasAtivasF = Number(horaF+minutosF)
                                                                //console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasF)

                                                                //Se comecar antes e acabar durante a reserva
                                                                if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasInicio_desativas) && (HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                                                    //console.log('Passei aqui 1')
                                                                    Disponivel = false
                                                                    break
                                                                }else{
                                                                    //Se comecar durante a reserva e acabar depois
                                                                    if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                        //console.log('Passei aqui 2')
                                                                        Disponivel = false
                                                                        break
                                                                    }else{
                                                                        //Se a reserva comecar antes e acabar depois
                                                                        if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                                                            //console.log('Passei aqui 3')
                                                                            Disponivel = false
                                                                            break
                                                                        }else{
                                                                            //Se a reserva comecar depois e acabar antes
                                                                            if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) && (HorasAtivasF >= HorasInicio_desativas) &&(HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                                                                //console.log('Passei aqui 4')
                                                                                Disponivel = false
                                                                                break
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            //Nao sobrepoem a reserva logo pode ser ativada
                                                            if(Disponivel){
                                                                //Nao existem reservas com essa data entao pode-se dar update 
                                                                var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                                const data = await reserva.update({
                                                                    NomeReserva: Nome_Limpo,
                                                                    DataReserva: DataReserva,
                                                                    NumeroParticipantes: participantesLimp,
                                                                    HoraInicio: HoraInicio,
                                                                    HoraFim: HoraFim
                                                                }, {where: {id: id}})
                                                                .then(function(data){return data;})
                                                                .catch(error => {
                                                                    console.log('Error:'+error)
                                                                    return error;
                                                                }) 
                                                                if(data)
                                                                    res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                                else
                                                                    res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                            }else{
                                                                res.json({sucesso: false, message: 'A reserva sobrepoem outra reserva'})
                                                            }
                                                        }else{
                                                            //Nao existem reservas com essa data entao pode-se dar update 
                                                            var Nome_Limpo = NomeReserva.normalize("NFD").replace(/[^a-zA-Zs]/, "");
                                                            const data = await reserva.update({
                                                                NomeReserva: Nome_Limpo,
                                                                DataReserva: DataReserva,
                                                                NumeroParticipantes: participantesLimp,
                                                                HoraInicio: HoraInicio,
                                                                HoraFim: HoraFim
                                                            }, {where: {id: id}})
                                                            .then(function(data){return data;})
                                                            .catch(error => {
                                                                console.log('Error:'+error)
                                                                return error;
                                                            }) 
                                                            if(data)
                                                                res.status(200).json({sucesso: true,data: data, message: 'Reserva atualizada com sucesso'});
                                                            else
                                                                res.json({sucesso:false, message: 'Nao foi possivel atualizar a reserva'})
                                                        }
                                                        //-------
                                                    }
                                                }else{
                                                    res.json({sucesso:false, message:'O centro esta desativado'})
                                                }
                                            }else{
                                                res.json({sucesso:false, message:'O centro nao existe'})
                                            }
                                        }
                                    }else{
                                        res.json({sucesso:false, message:'A hora final tem que ser superior a hora inicio'})
                                    }
                                }
                            }
                        }else{
                            res.json({sucesso:false, message:'A sala esta desativado'})
                        }
                    }else{
                        res.json({sucesso:false, message:'A sala escolhida nao existe'})
                    }
                }else{
                    res.json({sucesso:false, message:'O utilizador esta desativado'})
                }
            }else{
                res.json({sucesso:false, message:'O utilizador nao existe'})
            }
        }else
            res.json({sucesso:false, message:'A reserva esta desativada'})
    }else{
            res.json({sucesso:false, message:'A reserva nao existe'})
    }
}

//Eliminar reserva

controllers.delete = async (req, res) =>{
    const {id} = req.params;

    const reservadata = await reserva.findOne({
        where:{id:id}
    })

    if(reservadata){
        var limpezadestroy = await historicoLimpeza.destroy({
            where:{ReservaId: id}
        })

        var adiamentosdestroy = await historicoAdiamentos.destroy({
            where:{ReservaId: id}
        })

        var data = await reserva.destroy({
            where: {id: id},
        })
        res.status(200).json({
            sucesso: true,
            message: "Reserva eliminada com sucesso",
            deleted: data + '   ' + limpezadestroy + '   ' + adiamentosdestroy
        });
    }else{
        res.json({sucesso:false, message:"Erro: A reserva não existe!"});
    }
}

//Ativar Reserva

controllers.ativar = async (req, res) =>{ 
    const {id} = req.params;
    var Disponivel = true

    var reservaData = await reserva.findOne({
        where:{id:id}
    })

    if(reservaData){
        const Saladata = await sala.findOne({
            where:{id: reservaData.SalaId}
        })
        if(Saladata.EstadoId == 1){
            const HoraLimpezaSala = Saladata.Tempo_Limpeza
            //console.log('Horas de Limpeza da Sala: '+HoraLimpezaSala)
            if(reservaData.EstadoId == 2){
                //Verificar se a reserva esta em adamento
                var data_atual = new Date() 
                //console.log('Data atual: '+data_atual)
                var AnoAtual = (data_atual.getFullYear()).toString()
                var MesAtual = (data_atual.getMonth() + 1).toString()
                var DiaAtual = (data_atual.getDate()).toString()
                var DataAtualString = (AnoAtual + MesAtual + DiaAtual)
                /* console.log('Ano atual: ' + AnoAtual)
                console.log('Mes atual: ' + MesAtual)
                console.log('Dia atual: ' + DiaAtual)
                console.log('Data Atual final: ' + DataAtualString) */
                
                var dateReserva = new Date(reservaData.DataReserva) 
                //console.log('Data da reserva: '+dateReserva)
                var AnoReserva = (dateReserva.getFullYear()).toString()
                var MesReserva = (dateReserva.getMonth() + 1).toString()
                var DiaReserva = (dateReserva.getDate()).toString()
                var DataReservaString = (AnoReserva + MesReserva + DiaReserva)
                /* console.log('Ano atual: ' + AnoReserva)
                console.log('Mes atual: ' + MesReserva)
                console.log('Dia atual: ' + DiaReserva)
                console.log('Data Atual final: ' + DataReservaString) */

                //Verificar se ja passou
                if(DataAtualString > DataReservaString)
                    res.json({sucesso: false, message:'Nao e possivel ativar uma reserva que ja passou'})
                else{
                    //Primeiramente temos que ir buscar todas as reservas com a mesma data, depois temos que percorrer o array das reservase verificar se existe alguma reserva que possui a mesma hora que a data da reserva a ativar, podemos pegar nas horas eminutos e se estiver na mesma hora entao fazemos um numero com essa hora e os minutos e fazemos o mesmo para a reserva aativar se a hora inicio mais o tempo limpeza da sala for igual ou superior a hora inicio da reserva entao nao e possivelse nao ativa a reserva
                    const query = `select * from public."Reservas" where "Reservas"."EstadoId" = 1 and "Reservas"."DataReserva" = '${reservaData.DataReserva}' and "Reservas"."SalaId" = ${Saladata.id} and "Reservas"."id" != ${id} order by "Reservas"."HoraInicio"`
                    const reservas = await bd.query(query,{ type: QueryTypes.SELECT })
                    //console.log(reservas.length)
                    if(reservas.length != 0){
                        //Obter informacao da reserva que queremos ativar
                        //console.log(reservas)
                        //Hora Inicio
                        const horasInicioReserva = reservaData.HoraInicio;
                        //console.log('Hora da reserva desativa (formato Data): '+ horasInicioReserva)
                        const HoraInicio_Array = horasInicioReserva.split(':')
                        const horaInicio = HoraInicio_Array[0]
                        //console.log('Hora:' + horaInicio)
                        const minutosInicio = HoraInicio_Array[1]
                        //console.log('Minutos:' + minutosInicio)
                        const HorasInicio_desativas = Number(horaInicio+minutosInicio)
                        //console.log('Horas da reserva desativa (formato Numero): '+HorasInicio_desativas)

                        //Hora Fim
                        const horasFimReserva = reservaData.HoraFim;
                        //console.log('Hora da reserva desativa (formato Data): '+ horasFimReserva)
                        const HoraFim_Array = horasFimReserva.split(':')
                        const horaFim = HoraFim_Array[0]
                        //console.log('Hora:' + horaFim)
                        const minutosFim = HoraFim_Array[1]
                        //console.log('Minutos:' + minutosFim)
                        const Horas_em_Numero = Number(horaFim+minutosFim)
                        //console.log('Horas da reserva desativa (formato Numero): '+Horas_em_Numero)
                        const HorasFim_MaisLimpeza_Desativas = Horas_em_Numero + HoraLimpezaSala
                        //console.log('Horas da reserva desativa mais limpeza (formato Numero):' + HorasFim_MaisLimpeza_Desativas)

                        for(let i = 0; i < reservas.length; i++){
                            //Reserva para comparar
                            //Hora inicio
                            const horasInicio = reservas[i].HoraInicio;
                            //console.log('Hora da reserva ativa (formato Data): '+ horasInicio)
                            const horasInicio_Array = horasInicio.split(':')
                            const horaI = horasInicio_Array[0]
                            //console.log('Hora:' + horaI)
                            const minutosI = horasInicio_Array[1]
                            //console.log('Minutos:' + minutosI)
                            const HorasAtivasI = Number(horaI+minutosI)
                            //console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasI)
                            //Hora Fim
                            const horasFim = reservas[i].HoraFim;
                            //console.log('Hora da reserva ativa (formato Data): '+ horasFim)
                            const horasFim_Array = horasFim.split(':')
                            const horaF = horasFim_Array[0]
                            //console.log('Hora:' + horaF)
                            const minutosF = horasFim_Array[1]
                            //console.log('Minutos:' + minutosF)
                            const HorasAtivasF = Number(horaF+minutosF)
                            //console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasF)

                            //Se comecar antes e acabar durante a reserva
                            if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasInicio_desativas) && (HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                //console.log('Passei aqui 1')
                                Disponivel = false
                                break
                            }else{
                                //Se comecar durante a reserva e acabar depois
                                if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                    //console.log('Passei aqui 2')
                                    Disponivel = false
                                    break
                                }else{
                                    //Se a reserva comecar antes e acabar depois
                                    if((HorasAtivasI <= HorasInicio_desativas) && (HorasAtivasF >= HorasFim_MaisLimpeza_Desativas)){
                                        //console.log('Passei aqui 3')
                                        Disponivel = false
                                        break
                                    }else{
                                        //Se a reserva comecar depois e acabar antes
                                        if((HorasAtivasI >= HorasInicio_desativas) && (HorasAtivasI <= HorasFim_MaisLimpeza_Desativas) && (HorasAtivasF >= HorasInicio_desativas) &&(HorasAtivasF <= HorasFim_MaisLimpeza_Desativas)){
                                            //console.log('Passei aqui 4')
                                            Disponivel = false
                                            break
                                        }
                                    }
                                }
                            }
                        }
                        //Nao sobrepoem a reserva logo pode ser ativada
                        if(Disponivel){
                            const reservasdata = await reserva.update({
                                EstadoId: 1
                            },{where:{id:id}})
                            .then(function(data){return data;})
                            .catch(err=>console.log(err))
                            if(reservasdata)
                                res.json({sucesso: true, message: 'Reserva ativada com sucesso'})
                            else
                                res.json({sucesso: false, message: 'Nao foi possivel ativar a reserva'})
                        }else{
                            res.json({sucesso: false, message: 'A reserva sobrepoem outra reserva'})
                        }
                    }else{
                        //Nao existem reservas com essa data entao pode-se ativar 
                        const reservasdata = await reserva.update({
                            EstadoId: 1
                        },{where:{id:id}})
                        .then(function(data){return data;})
                        .catch(err=>console.log(err))
                        if(reservasdata)
                            res.json({sucesso: true, message: 'Reserva ativada com sucesso'})
                        else
                            res.json({sucesso: false, message: 'Nao foi possivel ativar a reserva'})
                    }
                }
            }else{
                res.json({sucesso:false, message:'A reserva ja se encontra ativa'})
            }
        }else{
            res.json({sucesso: false, message:'Sala encontra se desativada'})
        }
    }else
        res.json({sucesso: false, message:'Nao existe nehuma reserva com o id: ' + id})
}

//Desativar Reserva

controllers.desativar = async (req, res) =>{ 
    const {id} = req.params;
    var data

    var reservaData = await reserva.findOne({
        where:{id:id}
    })

    if(reservaData){
        if(reservaData.EstadoId == 1){
            //Verificar se a reserva esta em adamento
            var data_atual = new Date()
            var dateReserva = new Date(reservaData.DataReserva)
            if(date.isSameDay(data_atual,dateReserva)){
                var horas_atuais = (data_atual.getHours()).toString()
                //console.log('Horas atuas: ' + horas_atuais)
                var minutos_atuais = (data_atual.getMinutes()).toString()
                //console.log('Minutos atuais: ' + minutos_atuais)
                var hora_atual_numero = Number(horas_atuais + minutos_atuais)
                //console.log('Data atual em numero: '+hora_atual_numero)
                
                var hora_fim_array =  reservaData.HoraFim.split(':')
                var hora_fim_numero = Number(hora_fim_array[0] + hora_fim_array[1])
                //console.log('Hora fim: '+ hora_fim_numero)
                
                var hora_inicio_array =  reservaData.HoraInicio.split(':')
                var hora_incio_numero = Number(hora_inicio_array[0] + hora_inicio_array[1])
                //console.log('Hora Inicio: ' + hora_incio_numero);
                if(hora_incio_numero < hora_atual_numero && hora_fim_numero > hora_atual_numero){
                    //Esta a decorrer logo nao pode desativar
                    res.json({sucesso: false, message:'Nao e possivel desativar uma reserva em andamento'})
                }else{
                    if(hora_incio_numero < hora_atual_numero && hora_fim_numero < hora_atual_numero)
                        res.json({sucesso: false, message:'Nao e possivel desativar uma reserva que ja passou'})
                    else{
                        //esta para acontecer, logo desativa se
                        data = await reserva.update({
                            EstadoId: 2
                        },{where:{id:id}})
                        .then(function(data){return data;})
                        .catch(err=>console.log(err))
                        if(data)
                            res.json({sucesso:true, message:'A reserva foi desativada', data:data})
                        else
                            res.json({sucesso:false, message:'Nao foi possivel desativar a reserva'})
                    }
                }
            }else{
                //Verificar se ja passou
                if(data_atual.getTime() > dateReserva.getTime())
                    res.json({sucesso: false, message:'Nao e possivel desativar uma reserva que ja passou'})
                else{
                    //Se nao passou entao inativa nas tabelas que precisa e depois nas resevas
                        data = await reserva.update({
                            EstadoId: 2
                        },{where:{id:id}})
                        .then(function(data){return data;})
                        .catch(err=>console.log(err))
                        if(data)
                            res.json({sucesso:true, message:'A reserva foi desativada', data:data})
                        else
                            res.json({sucesso:false, message:'Nao foi possivel desativar a reserva'})
                }
            }
        }else{
            res.json({sucesso:false, message:'A reserva ja se encontra desativada'})
        }
    }else
        res.json({sucesso: false, message:'Nao existe nehuma reserva com o id: ' + id})
}

//Listar Reservas passadas com base no id do utilizador, e data atual
controllers.reservasPassadasdeUtilizador = async (req, res) =>{ 
    const {id} = req.params;
    const utilizadorData = await utilizador.findOne({
        where:{id:id}
    })
    if(utilizadorData){
        const query = `select * from public."Reservas" where "Reservas"."UtilizadoreId" = ${id} and "Reservas"."DataReserva" < CURRENT_DATE`
        const data = await bd.query(query,{ type: QueryTypes.SELECT })
        .then(function(data){return data;})
        .catch(err=>console.log(err))
        if(data)
            res.status(200).json({sucesso: true, data: data})
        else
            res.json({sucesso: false, message:'Não foi possível obter as reservas desse utilizador'})
    }else{
        res.json({sucesso:false, message:'O utilizador nao existe'})
    }
}

//Listar todas as reservas com base no id do utilizador
controllers.reservasdoUtilizador = async (req, res) =>{ 
    const {id} = req.params;
    const utilizadorData = await utilizador.findOne({
        where:{id:id}
    })
    if(utilizadorData){
        const query = `select * from public."Reservas" where "Reservas"."UtilizadoreId" = ${id}`
        const data = await bd.query(query,{ type: QueryTypes.SELECT })
        .then(function(data){return data;})
        .catch(err=>console.log(err))
        if(data)
            res.status(200).json({sucesso: true, data: data})
        else
            res.json({sucesso: false, message:'Não foi possível obter as reservas desse utilizador'})
    }else{
        res.json({sucesso:false, message:'O utilizador nao existe'})
    }
}

//Listar Reservas futuras com base no id do utilizador, e data e ativas 
controllers.reservasfuturasdoUtilizador = async (req, res) =>{ 
    const {id} = req.params;
    const utilizadorData = await utilizador.findOne({
        where:{id:id}
    })
    if(utilizadorData){
        const query = `select * from public."Reservas" where "Reservas"."UtilizadoreId" = ${id} and "Reservas"."DataReserva" > CURRENT_DATE and "Reservas"."EstadoId" = 1`
        const data = await bd.query(query,{ type: QueryTypes.SELECT })
        .then(function(data){return data;})
        .catch(err=>console.log(err))
        if(data)
            res.status(200).json({sucesso: true, data: data})
        else
            res.json({sucesso: false, message:'Não foi possível obter as reservas desse utilizador'})
    }else{
        res.json({sucesso:false, message:'O utilizador nao existe'})
    }
}

//Para adiar uma reserva temos que ir buscar uma reserva no mesmo dia com hora inicio superior a hora fim da reserva + hora limpeza

//Adiar reserva muda hora fim.

controllers.adiar = async(req,res) =>{
    const {id} = req.params;
    const {ValorHora} = req.body;
    var Disponivel = false

    if(ValorHora == ""){
        res.json({sucesso: false, message:"Insira uma hora valida"});
    }else{
        var reservaData = await reserva.findOne({
            where:{id:id}
        })

        if(reservaData){
            const Saladata = await sala.findOne({
                where:{id: reservaData.SalaId}
            })
            if(Saladata.EstadoId == 1){
                const CentroData = await centro.findOne({
                    where:{id:Saladata.CentroId}
                })
                if(CentroData){
                    if(CentroData.EstadoId ==1){
                        const HoraLimpezaSala = Saladata.Tempo_Limpeza
                        console.log('Horas de Limpeza da Sala: '+HoraLimpezaSala)
                        if(reservaData.EstadoId == 1){
                            //Verificar se a reserva esta em adamento
                            var data_atual = new Date() 
                            console.log('Data atual: '+data_atual)
                            var AnoAtual = (data_atual.getFullYear()).toString()
                            var MesAtual = (data_atual.getMonth() + 1).toString()
                            var DiaAtual = (data_atual.getDate()).toString()
                            var DataAtualString = (AnoAtual + MesAtual + DiaAtual)
                            console.log('Ano atual: ' + AnoAtual)
                            console.log('Mes atual: ' + MesAtual)
                            console.log('Dia atual: ' + DiaAtual)
                            console.log('Data Atual final: ' + DataAtualString)
                            
                            var dateReserva = new Date(reservaData.DataReserva) 
                            console.log('Data da reserva: '+dateReserva)
                            var AnoReserva = (dateReserva.getFullYear()).toString()
                            var MesReserva = (dateReserva.getMonth() + 1).toString()
                            var DiaReserva = (dateReserva.getDate()).toString()
                            var DataReservaString = (AnoReserva + MesReserva + DiaReserva)
                            console.log('Ano atual: ' + AnoReserva)
                            console.log('Mes atual: ' + MesReserva)
                            console.log('Dia atual: ' + DiaReserva)
                            console.log('Data Atual final: ' + DataReservaString)

                            //Verificar se ja passou
                            if(DataAtualString < DataReservaString || DataAtualString > DataReservaString){
                                console.log('Esta reserva nao e de hoje')
                                res.json({sucesso: false, message:'Nao e possivel adiar uma reserva que nao esta a decorrer'})
                            }else{
                                
                                var horaInicioCentro = CentroData.Hora_abertura
                                var horaInicioCentroArray = horaInicioCentro.split(':')
                                var horaInicioCentroNumber = Number(horaInicioCentroArray[0] + horaInicioCentroArray[1])
                                //console.log('Hora de abertura: ' + horaInicioCentroNumber
                                var horaFimCentro = CentroData.Hora_fecho
                                var horaFimCentroArray = horaFimCentro.split(':')
                                var horaFimCentroNumber = Number(horaFimCentroArray[0] + horaFimCentroArray[1])

                                //Hora Final da Reserva
                                const horasFimReserva = reservaData.HoraFim;
                                console.log('Hora da reserva defenida (formato Data): '+ horasFimReserva)
                                const HoraFim_Array = horasFimReserva.split(':')
                                const horaFim = HoraFim_Array[0]
                                console.log('Hora:' + horaFim)
                                const minutosFim = HoraFim_Array[1]
                                console.log('Minutos:' + minutosFim)
                                const Horas_em_Numero = Number(horaFim+minutosFim)
                                console.log('Horas da reserva defenida (formato Numero): '+Horas_em_Numero)
                                //Hora final pretendida
                                console.log('Hora pretendida e: ' + ValorHora)
                                const HoraFimPedida_Array = ValorHora.split(':')
                                console.log('Hora fim pedida depois do split: '+HoraFimPedida_Array)
                                const horaFimPedida = HoraFimPedida_Array[0]
                                console.log('Hora pretendida:' + horaFimPedida)
                                const minutosFimPedida = HoraFimPedida_Array[1]
                                console.log('Minutos pretendidos:' + minutosFimPedida)
                                const HorasPedidas_em_Numero = Number(horaFimPedida+minutosFimPedida)
                                console.log('Horas pretendida (formato Numero): '+HorasPedidas_em_Numero)

                                const query = `select * from public."Reservas" where "Reservas"."EstadoId" = 1 and "Reservas"."DataReserva" = '${reservaData.DataReserva}' and "Reservas"."SalaId" = ${Saladata.id} and "Reservas"."id" != ${id} and "Reservas"."HoraInicio" > '${reservaData.HoraFim}' order by "Reservas"."HoraInicio"`
                                const reservas = await bd.query(query,{ type: QueryTypes.SELECT })
                                console.log(reservas.length)
                                if(reservas.length != 0){
                                    //Obter informacao da reserva que queremos ativar
                                    console.log(reservas)
                                    //console.log('Hora de fechar: ' + horaFimCentroNumber)

                                    if(HorasPedidas_em_Numero < horaInicioCentroNumber || HorasPedidas_em_Numero > horaFimCentroNumber){
                                        res.json({sucesso:false, message:'A hora inserida tem que estar entre '+CentroData.Hora_abertura+' e '+CentroData.Hora_fecho})
                                    }else{
                                        if(HorasPedidas_em_Numero < Horas_em_Numero){
                                            res.json({sucesso: false, message:'Insira uma hora superior a ' + reservaData.HoraFim})
                                        }else{
                                            if(HorasPedidas_em_Numero == Horas_em_Numero){
                                                res.json({sucesso:false, message:'Hora Final nao pode ser igual a hora final anterior'})
                                            }else{
                                                const HorasFim_MaisLimpeza_Desativas = HoraLimpezaSala + HorasPedidas_em_Numero
                                                console.log('Horas da reserva mais limpeza antes(formato Numero):' + Horas_em_Numero + HoraLimpezaSala)
                                                console.log('Horas da reserva mais limpeza depois(formato Numero):' + HorasFim_MaisLimpeza_Desativas)

                                                for(let i = 0; i < reservas.length; i++){
                                                    //Reserva para comparar
                                                    //Hora inicio
                                                    const horasInicio = reservas[i].HoraInicio;
                                                    console.log('Hora da reserva ativa (formato Data): '+ horasInicio)
                                                    const horasInicio_Array = horasInicio.split(':')
                                                    const horaI = horasInicio_Array[0]
                                                    console.log('Hora:' + horaI)
                                                    const minutosI = horasInicio_Array[1]
                                                    console.log('Minutos:' + minutosI)
                                                    const HorasAtivasI = Number(horaI+minutosI)
                                                    console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasI)

                                                    //Hora Fim
                                                    const horasFim = reservas[i].HoraFim;
                                                    console.log('Hora da reserva ativa (formato Data): '+ horasFim)
                                                    const horasFim_Array = horasFim.split(':')
                                                    const horaF = horasFim_Array[0]
                                                    console.log('Hora:' + horaF)
                                                    const minutosF = horasFim_Array[1]
                                                    console.log('Minutos:' + minutosF)
                                                    const HorasAtivasF = Number(horaF+minutosF)
                                                    console.log('Horas da reserva ativa (formato Numero): '+HorasAtivasF)

                                                    //Se acabar antes da reserva comecar
                                                    if(HorasFim_MaisLimpeza_Desativas <= HorasAtivasI){
                                                        console.log('Passei aqui ')
                                                        Disponivel = true
                                                        break
                                                    }
                                                }
                                                //Nao sobrepoem a reserva logo pode ser prolongada
                                                if(Disponivel){
                                                    const reservasdata = await reserva.update({
                                                        HoraFim:ValorHora 
                                                    },{where:{id:id}})
                                                    .then(function(data){return data;})
                                                    .catch(err=>console.log(err))
                                                    const pertenceData = await historicoAdiamentos.create({
                                                        HoraAntiga:reservaData.HoraFim,
                                                        HoraAdiada:ValorHora,
                                                        ReservaId:id
                                                    })
                                                    .then(function(pertenceData){return pertenceData;})
                                                    .catch(err=>console.log(err))
                                                    if(reservasdata && pertenceData)
                                                        res.json({sucesso: true, message: 'Reserva adiada com sucesso'})
                                                    else
                                                        res.json({sucesso: false, message: 'Nao foi possivel adiar a reserva'})
                                                }else{
                                                    res.json({sucesso: false, message: 'A reserva sobrepoem outra reserva.'})
                                                }
                                            }
                                        }
                                    }
                                }else{
                                    if(HorasPedidas_em_Numero < horaInicioCentroNumber || HorasPedidas_em_Numero > horaFimCentroNumber){
                                        res.json({sucesso:false, message:'A hora inserida tem que estar entre ' +CentroData.Hora_abertura+' e '+CentroData.Hora_fecho})
                                    }else{
                                        if(HorasPedidas_em_Numero < Horas_em_Numero){
                                            res.json({sucesso: false, message:'Insira uma hora superior a ' + reservaData.HoraFim})
                                        }else{
                                            //Nao existem reservas com essa data entao pode-se adiar a vontade 
                                            const reservasdata = await reserva.update({
                                                    HoraFim:ValorHora 
                                            },{where:{id:id}})
                                            .then(function(data){return data;})
                                            .catch(err=>console.log(err))
                                            const pertenceData = await historicoAdiamentos.create({
                                                HoraAntiga:reservaData.HoraFim,
                                                HoraAdiada:ValorHora,
                                                ReservaId:id
                                            })
                                            .then(function(pertenceData){return pertenceData;})
                                            .catch(err=>console.log(err))
                                            if(reservasdata && pertenceData)
                                                res.json({sucesso: true, message: 'Reserva adiada com sucesso'})
                                            else
                                                res.json({sucesso: false, message: 'Nao foi possivel adiar a reserva'})
                                        }
                                    }
                                }
                            }
                        }else{
                            res.json({sucesso:false, message:'A reserva encontra se desativada'})
                        }
                    }else{
                        res.json({sucesso:false, message:'O centro esta desativado'})
                    }
                }else{
                    res.json({sucesso:false, message:'O centro nao existe'})
                }
            }else{
                res.json({sucesso: false, message:'Sala encontra se desativada'})
            }
        }else
            res.json({sucesso: false, message:'Nao existe nehuma reserva com o id: ' + id})
    }
}

//Terminar mais cedo
controllers.terminarCedo = async(req,res) =>{
    const {id} = req.params;

    var reservaData = await reserva.findOne({
        where: {id:id}
    })

    if(reservaData){
        const Saladata = await sala.findOne({
            where:{id: reservaData.SalaId}
        })
        if(Saladata){
            if(Saladata.EstadoId == 1){
                const CentroData = await centro.findOne({
                    where:{id:Saladata.CentroId}
                })
                if(CentroData){
                    if(CentroData.EstadoId ==1){
                        if(reservaData.EstadoId == 1){
                            //Verificar se a reserva esta em adamento
                            var data_atual = new Date() 
                            console.log('Data atual: '+data_atual)
                            var AnoAtual = (data_atual.getFullYear()).toString()
                            var MesAtual = (data_atual.getMonth() + 1).toString()
                            var DiaAtual = (data_atual.getDate()).toString()
                            var DataAtualString = (AnoAtual + MesAtual + DiaAtual)
                            var Hora_atual = (data_atual.getHours()).toString()
                            var minutos_atual = (data_atual.getMinutes()).toString()
                            var HoraAtualString = Hora_atual + ':' + minutos_atual
                            var HoraAtualNumero= Number(Hora_atual + minutos_atual)
                            console.log('Ano atual: ' + AnoAtual)
                            console.log('Mes atual: ' + MesAtual)
                            console.log('Dia atual: ' + DiaAtual)
                            console.log('Data Atual final: ' + DataAtualString)
                            console.log('Hora atual: ' + Hora_atual)
                            console.log('Mes atual: ' + minutos_atual)
                            console.log('Hora atual atual: ' + HoraAtualString)
                            console.log('Hora atual atual formato numero: ' + HoraAtualNumero)

                            var dateReserva = new Date(reservaData.DataReserva) 
                            console.log('Data da reserva: '+dateReserva)
                            var AnoReserva = (dateReserva.getFullYear()).toString()
                            var MesReserva = (dateReserva.getMonth() + 1).toString()
                            var DiaReserva = (dateReserva.getDate()).toString()
                            var DataReservaString = (AnoReserva + MesReserva + DiaReserva)
                            console.log('Ano atual: ' + AnoReserva)
                            console.log('Mes atual: ' + MesReserva)
                            console.log('Dia atual: ' + DiaReserva)
                            console.log('Data Atual final: ' + DataReservaString)
                             //Verificar se ja passou
                            if(DataAtualString < DataReservaString || DataAtualString > DataReservaString){
                                console.log('Esta reserva nao e de hoje')
                                res.json({sucesso: false, message:'Nao e possivel acabar uma reserva que nao esta a decorrer'})
                            }else{

                                var horaInicioCentro = CentroData.Hora_abertura
                                var horaInicioCentroArray = horaInicioCentro.split(':')
                                var horaInicioCentroNumber = Number(horaInicioCentroArray[0] + horaInicioCentroArray[1])
                                //console.log('Hora de abertura: ' + horaInicioCentroNumber
                                var horaFimCentro = CentroData.Hora_fecho
                                var horaFimCentroArray = horaFimCentro.split(':')
                                var horaFimCentroNumber = Number(horaFimCentroArray[0] + horaFimCentroArray[1])
                                 //Hora Final da Reserva
                                const horasFimReserva = reservaData.HoraFim;
                                console.log('Hora da reserva defenida (formato Data): '+ horasFimReserva)
                                const HoraFim_Array = horasFimReserva.split(':')
                                const horaFim = HoraFim_Array[0]
                                console.log('Hora:' + horaFim)
                                const minutosFim = HoraFim_Array[1]
                                console.log('Minutos:' + minutosFim)
                                const Horas_em_Numero = Number(horaFim+minutosFim)
                                console.log('Horas da reserva defenida (formato Numero): '+Horas_em_Numero)
                                 //Hora Inicio
                                const horasInicioReserva = reservaData.HoraInicio;
                                //console.log('Hora da reserva desativa (formato Data): '+ horasInicioReserva)
                                const HoraInicio_Array = horasInicioReserva.split(':')
                                const horaInicio = HoraInicio_Array[0]
                                //console.log('Hora:' + horaInicio)
                                const minutosInicio = HoraInicio_Array[1]
                                //console.log('Minutos:' + minutosInicio)
                                const HorasInicio_desativas = Number(horaInicio+minutosInicio)
                                //console.log('Horas da reserva desativa (formato Numero): '+HorasInicio_desativas)
                                if(HoraAtualNumero < horaInicioCentroNumber || HoraAtualNumero > horaFimCentroNumber){
                                        res.json({sucesso:false, message:'Nao e possivel adiar a reserva. Horario do centro = '+CentroData.Hora_abertura+' e '+CentroData.Hora_fecho})
                                }else{
                                    //Se acabar depois da reserva acabar
                                    if(HoraAtualNumero > Horas_em_Numero){
                                        res.json({sucesso: false, message:'Nao e possivel acabar uma reserva que ja acabou'})
                                    }else{
                                        //Se acabar antes da reserva acabar
                                        if(HoraAtualNumero <= Horas_em_Numero && (HoraAtualNumero >= HorasInicio_desativas)){
                                            console.log('Passei aqui ')
                                            Disponivel = true
                                        }
                                    }
                                    //A reserva esta a decorrer e a hora atual e menor que a hora fim da reserva e maior que a hora inicio
                                    if(Disponivel){
                                        const reservasdata = await reserva.update({
                                            HoraFim:HoraAtualString,
                                        },{where:{id:id}})
                                        .then(function(data){return data;})
                                        .catch(err=>console.log(err))
                                        const pertenceData = await historicoAdiamentos.destroy({
                                            where:{
                                                HoraAdiada: reservaData.HoraFim,
                                                ReservaId: id
                                            }
                                        })
                                        .then(function(pertenceData){return pertenceData;})
                                        .catch(err=>console.log(err))
                                        if(reservasdata)
                                            res.json({sucesso: true, message: 'Reserva terminada com sucesso'})
                                        else
                                            res.json({sucesso: false, message: 'Nao foi possivel terminar a reserva'})
                                    }else{
                                        res.json({sucesso: false, message: 'Nao e possivel terminar a sua reserva'})
                                    }
                                }
                            }
                        }else{
                            res.json({sucesso:false, message:'A reserva encontra se desativada'})
                        }
                    }else{
                        res.json({sucesso:false, message:'O centro esta desativado'})
                    }
                }else{
                    res.json({sucesso:false, message:'O centro nao existe'})
                }
            }else{
                res.json({sucesso: false, message:'Sala encontra se desativada'})
            }
        }else{
            res.json({sucesso:false, message:'A sala nao existe'})
        }
    }else{
        res.json({sucesso: false, message:'Nao existe nehuma reserva com o id: ' + id})
    }
}

module.exports = controllers
