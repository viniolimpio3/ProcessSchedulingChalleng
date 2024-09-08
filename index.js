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
        quantumCol: document.getElementById('quantum-col'),
        prioridades,
        temposChegada,
        temposServ,
        arrCh,
        arrServ,
        arrPrio,
        quantum,
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
    console.log(':)')

    let r = calcular()
    console.log(r)

    // plotaGrafico(r)

    // document.getElementById('t-medio-exec').innerHTML = `(${r.processes.map(p => p.totalExec.toString()).join(' + ')}) / ${r.processes.length} = ${r.tempoMedExec.toFixed(2)}`
    // document.getElementById('t-medio-espera').innerHTML = `(${r.processes.map(p => p.tEspera.toString()).join(' + ')}) / ${r.processes.length} = ${r.tempoMedEspera.toFixed(2)}`
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

function organizaTemposEspera(processes, idAtual, lastId, t) {
    if(idAtual == lastId)
        return processes

    processes[lastId].arrEspera.push(t - 1)

    return processes
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
        if(q.length > 0)
            q = ordenaPorService(q)

        let lastId = id
        id = q.length > 0 ? (q[0].id ?? '') : '' // 'id' do processo de execução atual


        if(q.length > 0 && id != lastId)
            f.processes[id].arrExec.push(t)

        //se o id atual != do ID anterior:
        // if(lastId != id){
        //     let aux = f.processes[lastId].arrEspera

        //     f.processes[lastId].arrEspera[aux.length - 1][1] = t - 1 // o último processo executou até o instante t - 1

        //     aux = f.processes[id].arrEspera
        //     f.processes[id].arrEspera[aux.length - 1] = [t] // adiciona o start do processo
        // }
        
        if(q.length > 0)
            f.processes = organizaTemposEspera(f.processes, id, lastId, t)

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
                f.processes[id].arrEspera.push(f.processes[id].t)
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


var ctx = document.getElementById('grafico-final').getContext('2d');
var grafico = null

function plotaGrafico(data) {
    let datasets = []

    if(grafico != null)
        grafico.destroy()

    for (let proc of data.processes) {
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