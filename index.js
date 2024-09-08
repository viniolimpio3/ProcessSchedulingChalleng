document.getElementById('tempos-chegada').onchange = changeInput
document.getElementById('tempos-servico').onchange = changeInput
document.getElementById('prioridades').onchange = changeInput
document.getElementById('quantum').onchange = changeInput

function changeInput(event) {
    const input = event.target;
    let regex = new RegExp(/^[0-9]+(?:; ?[0-9]+)*$/)

    // O tempo de serviço não pode ter valor 0
    if (input.id == 'tempos-servico')
        regex = new RegExp(/^[1-9]+(?:; ?[1-9]+)*$/)
    else if (input.id == 'prioridades')
        regex = new RegExp(/^[1-5](?:; ?[1-5])*$/)
    else if (input.id == 'quantum')
        regex = new RegExp(/^[1-9]+$/)

    if (!regex.test(input.value))
        input.classList.add('is-invalid')
    else
        input.classList.remove('is-invalid')
}

document.getElementById('algoritmo').onchange = (event) => {
    const select = event.target
    const quantumCol = document.getElementById('quantum-col')
    const prioridadeCol = document.getElementById('col-prioridades')

    if (select.value == 'rr')
        quantumCol.removeAttribute('hidden')
    else
        quantumCol.setAttribute('hidden', true)

    if (select.value == 'priop' || select.value == 'prioc')
        prioridadeCol.removeAttribute('hidden')
    else
        prioridadeCol.setAttribute('hidden', true)
}

function returnFields() {
    const temposChegada = document.getElementById('tempos-chegada')
    const temposServ = document.getElementById('tempos-servico')
    const prioridades = document.getElementById('prioridades')
    const quantum = document.getElementById('quantum')

    const arrCh = temposChegada.value.split(';')
    const arrServ = temposServ.value.split(';')
    const arrPrio = prioridades.value.split(';')

    let processes = []
    for (let i = 0; i < arrCh.length; i++) {
        processes.push({
            id: i,
            name: 'P-' + (i + 1),
            arrive: parseInt(arrCh[i]),
            service: parseInt(arrServ[i]),
            remaining: parseInt(arrServ[i]), // o quanto de tempos de serviços que faltam
            priority: parseInt(arrPrio[i] ?? 0),
            finished: false,
            totalExec: 0, // Tempo de execução total (wait + service)
            tEspera: 0, // espera do processo na fila
            tIni: -1,
            tFin: 0,
            arrEspera: [],
            arrExec: []
        })
    }

    return {
        selectAlg: document.getElementById('algoritmo'),
        prioridades,
        temposChegada,
        temposServ,
        arrCh,
        arrServ,
        arrPrio,
        quantum: parseInt(quantum.value),
        processes
    }
}

function preValidacoes() {
    let f = returnFields()
    // a Quantidade de "tempos" / processos deve ser a mesma


    if (f.arrCh.length != f.arrServ.length) {
        return {
            success: false,
            message: 'A quantidade de processos deve ser a mesma entre os dois campos (tempos de chegada e tempos de serviço)'
        }
    }


    if (f.prioridades.value != '' && f.prioridades.value != null && f.arrPrio.length != f.arrCh.length) {
        return {
            success: false,
            message: 'A quantidade de processos deve ser a mesma entre os dois campos (tempos de chegada e prioridades)'
        }
    }

    if (f.arrCh.length == 0)
        return {
            success: false,
            message: 'Preencha os campos obrigatórios!'
        }

    return {
        success: true
    }
}

document.getElementById('btn-calc').onclick = () => {
    let val = preValidacoes()
    if (!val.success) {
        alert("Erro: " + val.message)
        return;
    }

    let r = calcular()
    
    console.log('response', r)

    plotaGrafico(r)

    document.getElementById('t-medio-exec').innerHTML = `(${r.processes.map(p => p.totalExec.toString()).join(' + ')}) / ${r.processes.length} = ${r.tempoMedExec.toFixed(2)}`
    document.getElementById('t-medio-espera').innerHTML = `(${r.processes.map(p => p.tEspera.toString()).join(' + ')}) / ${r.processes.length} = ${r.tempoMedEspera.toFixed(2)}`
}


function calcular() {
    let f = returnFields()

    let response = []
    switch (f.selectAlg.value) {
        case 'fcfs':
            response = fcfs()
            break;
        case 'sjf':
            response = sjf()
            break;
        case 'srtf':
            response = srtf()
            break;
        case 'priop':
            response = priop()
            break;
        case 'prioc':
            response = prioc()
            break;
        case 'rr':
            response = roundRobin()
            break;
        default:
            break;
    }


    // Calcular respon
    let tempoMedExec = 0
    let tempoMedEspera = 0

    tempoMedExec = (response.processes.reduce((acc, current) => {
        return acc + current.totalExec
    }, 0)) / f.processes.length
    tempoMedEspera = (response.processes.reduce((acc, current) => {
        return acc + current.tEspera
    }, 0)) / f.processes.length

    return {
        processes: response.processes,
        t: response.t,
        tempoMedExec,
        tempoMedEspera
    }
}

function searchArrivingProcess(fields, t) {
    return fields.processes.filter(e => e.arrive == t)
}

function buscaIndiceMenorServiceNaFila(processes){
    let obj = processes.reduce( (acc, current, index) => current.service < acc.service ? { service: current.service, index: index } : acc, { service: Number.MAX_VALUE, index: -1 })
    return obj.index
}

function ordenaPorService(processes) {
    return processes.sort( ( a, b ) => (a.remaining < b.remaining) ? -1 : ((a.remaining > b.remaining) ? 1 : 0))
}

function ordenaPorPrioridade(processes) {
    return processes.sort( ( a, b ) => (a.priority < b.priority) ? 1 : ((a.priority > b.priority) ? -1 : 0))
}

function calculaTemposEspera(processes) {
    return processes.map( e => {
        if(e.tIni == e.arrive && e.arrEspera.length == 0)
            return e

        e.tEspera = e.tIni - e.arrive
        if(e.arrEspera.length > 0) {
            for(let i = 0; i < e.arrEspera.length; i++){ 
                console.log(e.arrExec[i + 1], e.arrEspera[i], e.arrExec[i + 1] - e.arrEspera[i])
                e.tEspera += e.arrExec[i + 1] - e.arrEspera[i]
            }
        }
        
        return e
    })
}

function fcfs() {
    let f = returnFields()
    console.log('fields', f)
    let t = 0
    let finished = false

    q = []

    let id = ''

    let firstExec = true

    while (!finished) {

        // Busca os processos que chegaram no instante atual de execução
        for (let p of searchArrivingProcess(f, t))
            q.push(p)

        // Se a fila zerou e não há mais processos a serem executados
        if (q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }

        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual

        if(q.length > 0 && f.processes[id].tIni == -1 && t != 0 && firstExec == false)
            f.processes[id].tIni = t

        // Quando um Processo finaliza toda sua execução
        if (q.length > 0 && q[0].remaining == 0) {

            f.processes[id].tFin = t
            f.processes[id].totalExec = t - f.processes[id].arrive

            f.processes[id].finished = true

            q.shift() // REMOVE o processo atual da fila

            if (q.length > 0) {
                id = q[0].id
                f.processes[id].tIni = t
                f.processes[id].tEspera = t - f.processes[id].arrive
            }
        }

        if (firstExec && q.length > 0) { // se for a primeira exec e já tiverem processos na fila!
            f.processes[id].tIni = t
            f.processes[id].tEspera = t - f.processes[id].arrive
            firstExec = false
        }

        if (q.length > 0)
            q[0].remaining -= 1

        t++;
    }

    return {
        processes: f.processes,
        t
    }
}

function sjf() {
    let f = returnFields()
    console.log('fields', f)
    let t = 0
    let finished = false

    q = []

    let id = ''

    let firstExec = true

    while (!finished) {

        // Busca os processos que chegaram no instante atual de execução
        for (let p of searchArrivingProcess(f, t))
            q.push(p)

        
        // Se a fila zerou e não há mais processos a serem executados
        if (q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }

        // Busca o item com o menor service na fila atual ao realizar a ordenação!
        if(firstExec && q.length > 0)
            q = ordenaPorService(q)

        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual

        if(q.length > 0 && f.processes[id].tIni == -1 && t != 0 && firstExec == false)
            f.processes[id].tIni = t

        // Quando um Processo finaliza toda sua execução
        if (q.length > 0 && q[0].remaining == 0) {

            f.processes[id].tFin = t
            f.processes[id].totalExec = t - f.processes[id].arrive

            f.processes[id].finished = true

            q.shift() // REMOVE o processo atual da fila

            if (q.length > 0) {
                q = ordenaPorService(q)

                id = q[0].id
                f.processes[id].tIni = t
                f.processes[id].tEspera = t - f.processes[id].arrive
            }
        }

        if (firstExec && q.length > 0) { // se for a primeira exec e já tiverem processos na fila!
            f.processes[id].tIni = t
            f.processes[id].tEspera = t - f.processes[id].arrive
            firstExec = false
        }

        if (q.length > 0)
            q[0].remaining -= 1

        t++;
    }

    return {
        processes: f.processes,
        t
    }
}

function srtf() {
    let f = returnFields()
    console.log('fields', f)
    let t = 0
    let finished = false

    q = []

    let id = ''
    let lastId = ''

    let firstExec = true

    while (!finished) {

        // Busca os processos que chegaram no instante atual de execução
        for (let p of searchArrivingProcess(f, t))
            q.push(p)

        // Se a fila zerou e não há mais processos a serem executados
        if (q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }

        // Busca o item com o menor service (remaining) na fila atual ao realizar a ordenação!
        if(q.length > 0)
            q = ordenaPorService(q)

        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual
        
        if(q.length > 0 && id != lastId){

            if(firstExec || (lastId !== '' && !f.processes[lastId].finished))
                f.processes[id].arrExec.push(t)
            
            if(lastId !== '' && !f.processes[lastId].finished)
                f.processes[lastId].arrEspera.push(t)
        }
        
        if(q.length > 0 && f.processes[id].tIni == -1 && t != 0 && firstExec == false)
            f.processes[id].tIni = t
        
        lastId = id

        // Quando um Processo finaliza toda sua execução
        if (q.length > 0 && q[0].remaining == 0) {

            f.processes[id].tFin = t
            f.processes[id].totalExec = t - f.processes[id].arrive

            f.processes[id].finished = true

            q.shift() // REMOVE o processo atual da fila

            if (q.length > 0) {

                q = ordenaPorService(q)

                id = q[0].id
                lastId = id
                
                f.processes[id].arrExec.push(t)

                if(f.processes[id].tIni == -1)
                    f.processes[id].tIni = t

            }
        }

        if (firstExec && q.length > 0) { // se for a primeira exec e já tiverem processos na fila!
            f.processes[id].tIni = t
            f.processes[id].arrExec.push(t)
            firstExec = false
        }

        if (q.length > 0)
            q[0].remaining -= 1

        t++;
    }


    f.processes = calculaTemposEspera(f.processes)

    return {
        processes: f.processes,
        t
    }
}

function priop() {
    let f = returnFields()
    console.log('fields', f)
    let t = 0
    let finished = false

    q = []

    let id = ''
    let lastId = ''

    let firstExec = true

    while (!finished) {

        // Busca os processos que chegaram no instante atual de execução
        for (let p of searchArrivingProcess(f, t))
            q.push(p)

        // Se a fila zerou e não há mais processos a serem executados
        if (q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }

        // Busca o item com o menor service (remaining) na fila atual ao realizar a ordenação!
        if(q.length > 0 && q[0].remaining > 0)
            q = ordenaPorPrioridade(q)

        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual
        
        if(q.length > 0 && id != lastId){

            if(firstExec || (lastId !== '' && !f.processes[lastId].finished == false))
                f.processes[id].arrExec.push(t)

            if(lastId !== '' && f.processes[lastId].finished == false)
                f.processes[lastId].arrEspera.push(t)
        }
        
        if(q.length > 0 && f.processes[id].tIni == -1 && t != 0 && firstExec == false)
            f.processes[id].tIni = t
        
        lastId = id

        // Quando um Processo finaliza toda sua execução
        if (q.length > 0 && q[0].remaining == 0) {

            f.processes[id].tFin = t
            f.processes[id].totalExec = t - f.processes[id].arrive

            f.processes[id].finished = true

            q.shift() // REMOVE o processo atual da fila

            if (q.length > 0) {

                q = ordenaPorPrioridade(q)

                id = q[0].id

                lastId = id
                
                f.processes[id].arrExec.push(t)

                if(f.processes[id].tIni == -1)
                    f.processes[id].tIni = t

            }
        }

        if (firstExec && q.length > 0) { // se for a primeira exec e já tiverem processos na fila!
            f.processes[id].tIni = t
            f.processes[id].arrExec.push(t)
            firstExec = false
        }

        if (q.length > 0)
            q[0].remaining -= 1

        t++;
    }


    f.processes = calculaTemposEspera(f.processes)

    return {
        processes: f.processes,
        t
    }
}

function prioc() {
    let f = returnFields()
    console.log('fields', f)
    let t = 0
    let finished = false

    q = []

    let id = ''
    let lastId = ''

    let firstExec = true

    while (!finished) {

        // Busca os processos que chegaram no instante atual de execução
        for (let p of searchArrivingProcess(f, t))
            q.push(p)

        // Se a fila zerou e não há mais processos a serem executados
        if (q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }

        if(firstExec)
            q = ordenaPorPrioridade(q)

        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual
        
        if(q.length > 0 && f.processes[id].tIni == -1 && t != 0 && firstExec == false)
            f.processes[id].tIni = t
        
        lastId = id

        // Quando um Processo finaliza toda sua execução
        if (q.length > 0 && q[0].remaining == 0) {

            f.processes[id].tFin = t
            f.processes[id].totalExec = t - f.processes[id].arrive

            f.processes[id].finished = true

            q.shift() // REMOVE o processo atual da fila

            if (q.length > 0) {

                q = ordenaPorPrioridade(q)

                id = q[0].id

                lastId = id
                
                f.processes[id].arrExec.push(t)

                if(f.processes[id].tIni == -1)
                    f.processes[id].tIni = t

            }
        }

        if (firstExec && q.length > 0) { // se for a primeira exec e já tiverem processos na fila!
            f.processes[id].tIni = t
            f.processes[id].arrExec.push(t)
            firstExec = false
        }

        if (q.length > 0)
            q[0].remaining -= 1

        t++;
    }


    f.processes = calculaTemposEspera(f.processes)

    return {
        processes: f.processes,
        t
    }
}

function roundRobin() {
    let f = returnFields()
    console.log('rr', f)
    let t = 0
    let finished = false

    q = []

    let id = ''
    let lastId = ''

    let firstExec = true

    let quantumCount = 0

    while (!finished) {

        // Busca os processos que chegaram no instante atual de execução
        for (let p of searchArrivingProcess(f, t))
            q.push(p)

        // Se a fila zerou e não há mais processos a serem executados
        if (q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }

        // if(firstExec)
        //     q = ordenaPorPrioridade(q)

        // Se o quantum já acabou e o processo ainda não finalizou, manda ele pro final da fila
        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual

        if(q.length > 0 && quantumCount == f.quantum && f.processes[id].remaining > 0) {
            let first = q.shift()
            q.push(first)
            quantumCount = 0
            id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual
        }

        
        if(q.length > 0 && f.processes[id].tIni == -1 && t != 0 && firstExec == false)
            f.processes[id].tIni = t

        if(q.length > 0 && id != lastId){
            if(firstExec || (lastId !== '' && !f.processes[lastId].finished))
                f.processes[id].arrExec.push(t)
            
            if(lastId !== '' && !f.processes[lastId].finished)
                f.processes[lastId].arrEspera.push(t)
        }
        
        lastId = id

        


        // Quando um Processo finaliza toda sua execução
        if (q.length > 0 && q[0].remaining == 0) {

            f.processes[id].tFin = t
            f.processes[id].totalExec = t - f.processes[id].arrive

            f.processes[id].finished = true

            q.shift() // REMOVE o processo atual da fila

            quantumCount = 0

            if (q.length > 0) {

                // q = ordenaPorPrioridade(q)

                id = q[0].id

                lastId = id
                
                f.processes[id].arrExec.push(t)

                if(f.processes[id].tIni == -1)
                    f.processes[id].tIni = t

            }
        }

        if (firstExec && q.length > 0) { // se for a primeira exec e já tiverem processos na fila!
            f.processes[id].tIni = t
            f.processes[id].arrExec.push(t)
            firstExec = false
        }

        if (q.length > 0){
            q[0].remaining -= 1
            quantumCount++
        }

        t++;
    }


    f.processes = calculaTemposEspera(f.processes)

    return {
        processes: f.processes,
        t
    }
}

var ctx = document.getElementById('grafico-final').getContext('2d');
var grafico = null

function plotaGrafico(data) {
    let datasets = []

    if(grafico != null)
        grafico.destroy()

    for (let proc of data.processes) {

        if(proc.arrEspera.length > 0) { // preemptivo! possui mais de um valor por linha
            if (proc.arrive != proc.tIni)
                datasets.push({ // Add o tempo de espera inicial
                    label: proc.name,
                    data: [{ x: [proc.arrive, proc.tIni], y: proc.name }],
                    backgroundColor: `white`,
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderSkipped: false,
                    barThickness: 40
                })

            let corTempoNormal = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
            for(let i = 0; i < proc.arrExec.length; i++){ 

                let valorFin = proc.arrEspera[i] == null ? proc.tFin : proc.arrEspera[i]

                // Add os tempos de execução normal
                datasets.push({
                    label: proc.name,
                    data: [{ x: [proc.arrExec[i], valorFin], y: proc.name }],
                    backgroundColor: corTempoNormal,
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderSkipped: false,
                    barThickness: 40
                })
            }

            //Adiciona os tempos de espera de acordo com arrEspera
            for(let i = 0; i < proc.arrEspera.length; i++){ 
                datasets.push({
                    label: proc.name,
                    data: [{ x: [proc.arrEspera[i], proc.arrExec[i + 1]], y: proc.name }],
                    backgroundColor: `white`,
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderSkipped: false,
                    barThickness: 40
                })
            }

        } else {
            datasets.push({
                label: proc.name,
                data: [{ x: [proc.tIni, proc.tFin], y: proc.name }],
                backgroundColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
                borderColor: '#000000',
                borderWidth: 2,
                borderSkipped: false,
                barThickness: 40
            })
    
            // Adiciona espera:
            if (proc.tEspera > 0) {
                datasets.push({
                    label: proc.name + ' - Espera',
                    data: [{ x: [proc.arrive, proc.arrive + proc.tEspera], y: proc.name }],
                    backgroundColor: `white`,
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderSkipped: false,
                    barThickness: 40
                })
            }
        }

    }

    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.processes.map(item => item.name), // eixo y nomes
            datasets: datasets
        },
        options: {
            indexAxis: 'y', 
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    max: data.t  // limite no eixo x - de acordo com o valor de tempo máximo
                },
                y: {
                    stacked: true, // hab o empilhamento das barras
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw.x + ' Serviços'; // Exibe o "inicio","fim" serviços
                        }
                    }
                }
            }
        }
    })
}