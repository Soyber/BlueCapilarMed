const { createBot, createProvider, createFlow, addKeyword, EVENTS} = require('@bot-whatsapp/bot')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const RESPONSES_SHEET_ID = '1kKrxnF9Uk3NaS-AmS2OatTVunk2wVwJOX1oz-thb1pU'
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID);
const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json'));
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { transferableAbortSignal } = require('util');
const { ifError } = require('assert');
const { writeFileSync } = require("fs");
const { downloadMediaMessage } = require("@adiwajshing/baileys");

let STATUS = {}

const flowComollegar = addKeyword('4')
.addAnswer(
    '🌸 _Esta es la ubicación 🚩 de nuestra sede en *Medellín*, queda en la *Carrera 65 # 103g-59,* esperamos tu visita pronto y brindarte la mejor atención_ 😊',
    null,
    async (ctx, { provider }) => {
        const id = ctx.key.remoteJid
        const latitud = "6.301341";
        const longitud ="-75.566283";    
        const abc = await provider.getInstance()    
        await abc.sendMessage(id, { location: { degreesLatitude:latitud, degreesLongitude:longitud } })
})

const flowAsesoria = addKeyword('3').addAnswer(
    '🌸 _¡Perfecto! en un momento uno de nuestros asesores atenderá tu solicitud puedes dejar tu duda y trataremos de responder lo antes posible_',
    {capture:true},
    async (ctx, {provider}) =>{
        Nombre = ctx.pushName
        Telefono = ctx.from
        Mensaje = ctx.body
        id = `573136534099@s.whatsapp.net`    
        const refProvider = await provider.getInstance()
        await refProvider.sendMessage(id, { text: 
    `👨🏼‍💻 _*${Nombre}* necesita tu atención, escribele o llámalo a este número ${Telefono} para resolver esta duda : *${Mensaje}*_` })
      }
)

const flowTomadatos = addKeyword('Registro')
.addAnswer(
    '_¡No te preocupes! esto sólo tomara unos segundos_\n🌸 _¿Cuál es tu *Nombre y Apellido* ?_',{capture:true},
    async(ctx,{flowDynamic}) =>{
    telefono = ctx.from
    Name = STATUS[telefono] = {...STATUS[telefono], name : ctx.body}
    Phone = STATUS[telefono] = {...STATUS[telefono], phone : ctx.from}
    flowDynamic()
    }
).addAnswer(
    '🌸 _¿Cuál es tu *Número de Identificación* ?_',{capture:true},
    async(ctx,{flowDynamic}) =>{
    telefono = ctx.from
    Cedula = STATUS[telefono] = {...STATUS[telefono], cedula : ctx.body}
    flowDynamic()
    }
).addAnswer(
    '🌸 _¿Cuál es tu *Correo Electrónico* ?_',{capture:true},
    async(ctx,{flowDynamic,fallBack}) =>{
    telefono = ctx.from
    const respuesta = ctx.body
    Correo = STATUS[telefono] = {...STATUS[telefono], correo : ctx.body}
    if (respuesta.includes('@')) {
        flowDynamic() 
    } else {
        fallBack('🌸 _Recuerda escribir un correo válido ¿Cuál es tu *Correo Electrónico* ?_')
    }
    }
).addAnswer(
    '🌸 _¿Cuál es tu *Dirección* ?_',{capture:true},
    async(ctx,{flowDynamic}) =>{
    telefono = ctx.from
    Dirección = STATUS[telefono] = {...STATUS[telefono], dirección : ctx.body}
    flowDynamic()
    }
).addAnswer(
    '🌸 _¿Cuál es tu *Barrio* ?_',{capture:true},
    async(ctx,{flowDynamic}) =>{
    telefono = ctx.from
    Barrio = STATUS[telefono] = {...STATUS[telefono], barrio : ctx.body}

        const ingresar = await ingresarDatosDataBase()

    flowDynamic([{body:`🌸 _¡Excelente! tus datos se han cargado correctamente si deseas regresar al menú principal envía la palabra *Inicio*_`}])
    }
)

const tomaPedido2 = addKeyword('1').addAnswer('🌸 _¡Genial! ahora solo debes escribir lo que deseas llevar en *un sólo mensaje* Ejemplo: *1 termoprotector 1 Shampoo purify fresh y 1 brillo rubí*_',{capture:true},
async(ctx,{flowDynamic,provider}) =>{
    telefono = ctx.from
    Pedido = STATUS[telefono] = {...STATUS[telefono], pedido : ctx.body}
     
    const ingresar = await ingresarDatosPedido()
    const cosultar = await consultarBaseDeDatos(telefono)

    id = `573136534099@s.whatsapp.net`
    const abc = await provider.getInstance() 
    await abc.sendMessage(id, { text:`✍🏼 _Debes alistar y facturar un pedido para *${consultadosDB['Nombre']}* avisale a este número *${telefono}*_` })
   
    flowDynamic('🌸 _¡Perfecto! estamos alistando tu pedido, en unos instantes nuestro equipo de entrega se pondrá en contacto contigo para hacer la entrega de tu pedido, recuerda tener tu celular a la mano, espero hayas recibido la mejor atención_ 😊')
}
)

const pedidoDomicilio = addKeyword('2').addAction(
    async(ctx,{flowDynamic}) =>{
        Telefono = ctx.from
        const cosultar = await consultarBaseDeDatos(Telefono)
        await flowDynamic([{body:`🖨 _*Datos para Factura*_ 🖨\n_Estos son los datos para tu factura electrónica_\n🌸 _*Nombre:* ${consultadosDB['Nombre']}_\n🌸 _*Correo:* ${consultadosDB['Correo']}_\n🌸 _*Cédula:* ${consultadosDB['Cedula']}_\n🌸 _*Dirección:* ${consultadosDB['Dirección']}_\n🌸 _*Barrio:* ${consultadosDB['Barrio']}_`}])
    }
    ).addAnswer('_*¿Esta información está correcta?*_\n🌸 _*1)* Sí_\n🌸 _si deseas *Actualizar* envia la Palabra *Registro*_',null,null,[tomaPedido2])

const tomaPedido1 = addKeyword('1')
.addAnswer('🌸 _¡Genial! ahora solo debes escribir lo que deseas llevar en *un sólo mensaje* Ejemplo: *1 termoprotector 1 Shampoo purify fresh y 1 brillo rubí*_',{capture:true},
async(ctx,{flowDynamic,provider}) =>{
    telefono = ctx.from
    Pedido = STATUS[telefono] = {...STATUS[telefono], pedido : ctx.body}
    const id1 = ctx.key.remoteJid
    id = `573136534099@s.whatsapp.net`
    const latitud = "6.301341";
    const longitud ="-75.566283"; 
    const ingresar = await ingresarDatosPedido()
    const cosultar = await consultarBaseDeDatos(telefono)
    flowDynamic('🌸 _¡Perfecto! estamos alistando tu pedido puedes recogerlo en esta ubicación 🚩 de nuestra sede en *Medellín*, queda en la *Carrera 65 # 103g-59,* esperamos tu visita pronto y brindarte la mejor atención_ 😊')
    const abc = await provider.getInstance()
    await abc.sendMessage(id, { text:`✍🏼 _Debes alistar y facturar un pedido para *${consultadosDB['Nombre']}* avisale a este número *${telefono}*_` })
    await abc.sendMessage(id1, { location: { degreesLatitude:latitud, degreesLongitude:longitud } })
}
)



const pedidoBlue = addKeyword('1')
.addAction(
async(ctx,{flowDynamic}) =>{
    Telefono = ctx.from
    const cosultar = await consultarBaseDeDatos(Telefono)
    await flowDynamic([{body:`🖨 _*Datos para Factura*_ 🖨\n_Estos son los datos para tu factura electrónica_\n🌸 _*Nombre:* ${consultadosDB['Nombre']}_\n🌸 _*Correo:* ${consultadosDB['Correo']}_\n🌸 _*Cédula:* ${consultadosDB['Cedula']}_\n🌸 _*Dirección:* ${consultadosDB['Dirección']}_\n🌸 _*Barrio:* ${consultadosDB['Barrio']}_`}])
}
).addAnswer('_*¿Esta información está correcta?*_\n🌸 _*1)* Sí_\n🌸 _si deseas *Actualizar* envia la Palabra *Registro*_',null,null,[tomaPedido1])


const flowProductos = addKeyword('2')
.addAnswer('🌸 _¡Excelente!  ¿cómo te gustaría obtener tus *productos*?_\n🌸 _*1)* Recoger en Blue Capilar_\n🌸 _*2)* Envio a Domicilio_',null,
      async (ctx , {provider}) => {
        id = `573136534099@s.whatsapp.net`
        Telefono = ctx.from
        const refProvider = await provider.getInstance()
        await refProvider.sendMessage(id, { text:`✍🏼 _${Telefono} Tiene un *Pedido* en Proceso..._ 🔎` })
      
      },
      [pedidoBlue,pedidoDomicilio]
)

const flowAgenda = addKeyword('1').addAnswer(
    '🌸 _¡Genial! en este link 👉🏼 https://calendar.app.google/B2XYbd1XpM77Wffv7 puedes agendar tu cita de *valoración, retoque o procedimiento completo*, si la hora que deseas no está disponible escríbenos la hora y el día y uno de nuestros asesores te confirmará la disponibilidad lo antes posible._ 😉',
    {capture:true},
    async (ctx, {provider}) =>{
        Nombre = ctx.pushName
        Telefono = ctx.from
        Mensaje = ctx.body
        id = `573136534099@s.whatsapp.net` 

        const cosultar = await consultarVencimiento(Telefono)
        
        const Name = consultadosVe['Nombre']
        const Correo = consultadosVe['Correo']
        
        const refProvider = await provider.getInstance()
        await refProvider.sendMessage(id, { text: 
    `✍🏼 _*${Nombre}* cuyo número es ${Telefono} Necesita agendar una cita en este horario: *${Mensaje}*_\n🌸 _*Nombre* : ${Name}_\n🌸 _*Correo* : ${Correo}_` })
      }
)

const flowPrincipal = addKeyword(['Hola', 'Buenas', 'Facebook','facebook','Buenos','Holi','Dias','Noches','Tardes','INICIO'])
.addAction(
    async (ctx, {flowDynamic}) =>{
        const Nombre = ctx.pushName
        flowDynamic(`_¡Hola *${Nombre}!* 👋 en Blue Capilar 🌸 Estamos para ayudarte a lucir un cabello increíblemente saludable. ¡No te pierdas nuestras últimas tendencias en cuidado capilar siguiéndonos en Instagram!_ www.instagram.com/bluecapilarmed \n_A continuación te dejaré una lista de opciones_\n🌸 _*1)* Agendar Cita_\n🌸 _*2)* Productos_\n🌸 _*3)* Asesorías_\n🌸 _*4)* Còmo llegar?_`)
    }
).addAnswer('_*Envía sólo el número de la opción que elijas*_',{delay:500},null,[flowAgenda,flowAsesoria,flowProductos,flowComollegar])

// Envento de Bienvenida 

const flowInicio = addKeyword(EVENTS.WELCOME)
.addAction(
    async (ctx,{flowDynamic, endFlow}) =>{
        telefono = ctx.from
        Nombre = STATUS[telefono] = {...STATUS[telefono], nombre : ctx.pushName}
        Phone = STATUS[telefono] = {...STATUS[telefono], phone : ctx.from}

        const consultar = await consultarPublico(telefono)
        const Numero = consultados['Phone']

        if (Numero === undefined) {
            const ingresar = await ingresarDatos()
        } else {
            endFlow()
        }
    flowDynamic ()
    }
)


// Descuentos de Apertura 

const flowDecuentos = addKeyword(['Blue'])
.addAction(
    async (ctx, {flowDynamic}) =>{
        const Nombre = ctx.pushName
        flowDynamic(`_*${Nombre}!* 🌸 excelente vas a participar en una ruleta de *descuentos* 🥳 para ello necesitamos hacerte unas preguntas para que puedas redimir tu *descuento!*_ 🌸`)
    }
)
.addAnswer(
    '🌸 _¿Cúal es su *Nombre Completo*?_',{capture:true,delay:1000},
async (ctx,{flowDynamic}) =>{
    telefono = ctx.from
    Nombre = STATUS[telefono] = {...STATUS[telefono], nombre : ctx.body}
    Phone = STATUS[telefono] = {...STATUS[telefono], phone : ctx.from}
    descuentoAl = Math.floor(Math.random() * (31 - 10)) + 10;
    Descuento = STATUS[telefono] = {...STATUS[telefono], descuento : descuentoAl}
flowDynamic ()
}
).addAnswer(
    '🌸 _¿Cúal es su *Correo*?_',{capture:true},
    async(ctx,{flowDynamic}) =>{
        telefono = ctx.from
        Correo = STATUS[telefono] = {...STATUS[telefono], correo : ctx.body}
flowDynamic ()
}
).addAnswer(
    '🎲 _¡Girando la Ruleta de *Descuentos* !..._ 🎲',null,
    async(ctx,{flowDynamic}) =>{

const ingresar = await ingresarDatosbase();
const consultrar = await consultarVencimiento(telefono);    


await flowDynamic([{body:`🌸 _*${consultadosVe['Nombre']} Felicitaciones!* 🥳 obtuviste un maravilloso *${consultadosVe['Descuento']} %* de *descuento* en tu primer procedimiento con *Blue Capilar* 🌸 agenda ahora mismo tu cita en el siguiente link_ 👉🏼 https://calendar.app.google/B2XYbd1XpM77Wffv7`}])

}
)


// Funciones de Consulta e ingreso de Datos
async function consultarBaseDeDatos(telefono){
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Base de Datos'];                        
   
    consultadosDB = [];

    let rows = await sheet.getRows();
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Phone === telefono) {
           
                           
            consultadosDB['Nombre'] = row.Name
            consultadosDB['Cedula'] = row.Cedula 
            consultadosDB['Dirección'] = row.Dirección 
            consultadosDB['Correo'] = row.Correo
            consultadosDB['Phone'] = row.Phone
            consultadosDB['Barrio'] = row.Barrio
            
        
        }
           
}
           
return consultadosDB

};

async function consultarVencimiento(telefono){
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Descuentos Inicio'];                        
   
    consultadosVe = [];

    let rows = await sheet.getRows();
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Phone === telefono) {
           
                           
            consultadosVe['Nombre'] = row.Nombre
            consultadosVe['Cedula'] = row.Cedula 
            consultadosVe['Descuento'] = row.Descuento 
            consultadosVe['Correo'] = row.Correo
            consultadosVe['Phone'] = row.Phone
            consultadosVe['Name'] = row.Name
            
        
        }
           
}
           
return consultadosVe

};

async function consultarPublico(telefono){
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Publico'];                        
   
    consultados = [];

    let rows = await sheet.getRows();
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Phone === telefono) {
           
                           
            consultados['Nombre'] = row.Nombre
            consultados['Phone'] = row.Phone
            
            
        
        }
           
}
           
return consultados

};
async function ingresarDatosDataBase(){
    
    let rows = [{
        
        Name: STATUS[telefono].name,
        Phone: STATUS[telefono].phone,
        Correo: STATUS[telefono].correo,
        Dirección: STATUS[telefono].dirección,
        Cedula: STATUS[telefono].cedula,
        Barrio: STATUS[telefono].barrio,
    
    
        }];
        await doc.useServiceAccountAuth({
            client_email: CREDENTIALS.client_email,
            private_key: CREDENTIALS.private_key
        });
        await doc.loadInfo();
        let  sheet = doc.sheetsByTitle['Base de Datos'];
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            await sheet.addRow(row);}
    
}
async function ingresarDatosbase(){
    
    let rows = [{
        
        Nombre: STATUS[telefono].nombre,
        Phone: STATUS[telefono].phone,
        Correo: STATUS[telefono].correo,
        Descuento: STATUS[telefono].descuento,
        Cedula: STATUS[telefono].cedula,
    
    
        }];
        await doc.useServiceAccountAuth({
            client_email: CREDENTIALS.client_email,
            private_key: CREDENTIALS.private_key
        });
        await doc.loadInfo();
        let  sheet = doc.sheetsByTitle['Descuentos Inicio'];
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            await sheet.addRow(row);}
    
    }

async function ingresarDatos(){
    
        let rows = [{
            
            Nombre: STATUS[telefono].nombre,
            Phone: STATUS[telefono].phone,
           
        
        
            }];
            await doc.useServiceAccountAuth({
                client_email: CREDENTIALS.client_email,
                private_key: CREDENTIALS.private_key
            });
            await doc.loadInfo();
            let  sheet = doc.sheetsByTitle['Publico'];
            for (let index = 0; index < rows.length; index++) {
                const row = rows[index];
                await sheet.addRow(row);}
        
}
async function ingresarDatosPedido(){
    
    let rows = [{

        Pedido: STATUS[telefono].pedido,
        Nombre: consultadosDB['Nombre'],
        Cedula: consultadosDB['Cedula'],
        Dirección:consultadosDB['Dirección'], 
        Correo: consultadosDB['Correo'],
        Phone: consultadosDB['Phone'],
        Barrio:consultadosDB['Barrio'],
        
    
        }];
        await doc.useServiceAccountAuth({
            client_email: CREDENTIALS.client_email,
            private_key: CREDENTIALS.private_key
        });
        await doc.loadInfo();
        let  sheet = doc.sheetsByTitle['Pedidos Bot'];
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            await sheet.addRow(row);}
    
}

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal,flowDecuentos,flowInicio,flowTomadatos])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
