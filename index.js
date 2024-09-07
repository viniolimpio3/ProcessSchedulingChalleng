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

    if(select.value == 'priop' || select.value == 'prioc')
        prioridadeCol.removeAttribute('hidden')
    else 
        prioridadeCol.setAttribute('hidden', true)
}

function returnFields(){
    const temposChegada = document.getElementById('tempos-chegada')
    const temposServ = document.getElementById('tempos-servico')
    const prioridades = document.getElementById('prioridades')
    const quantum = document.getElementById('quantum')

    const arrCh = temposChegada.value.split(';')
    const arrServ = temposServ.value.split(';')
    const arrPrio = prioridades.value.split(';')

    let processes = []
    for(let i = 0; i < arrCh.length; i++) {
        processes.push({
            id: i,
            name: 'P-' + (i + 1),
            arrive: arrCh[i],
            service: arrServ[i],
            remaining: arrServ[i], // o quanto de serviços que faltam
            wait: 0, // espera do processo na fila
            totalExec: 0, // Tempo de execução total (wait + service)
            priority: arrPrio[i] ?? '',
            finished: false,
            tExec: 0,
            tEspera: 0,
            tIni: 0,
            tFin: 0
        })
    }

    return {
        selectAlg: document.getElementById('algoritmo'),
        quantumCol: document.getElementById('quantum-col'),
        prioridadeCol,
        temposChegada,
        temposServ,
        arrCh,
        arrServ,
        arrPrio,
        quantum,
        processes
    }
}

function preValidacoes(){
    let f = returnFields()
    // a Quantidade de "tempos" / processos deve ser a mesma
    
    if(f.arrCh.length != f.arrServ.length){
        return {
            success: false,
            message: 'A quantidade de processos deve ser a mesma entre os dois campos (tempos de chegada e tempos de serviço)'
        }
    }

    return {
        success: true
    }
}

document.getElementById('btn-calc').onclick = () => {
    let val = preValidacoes()
    if(!val.success){
        alert(val.message)
        return;
    }
    alert(":)")
}


function calcular(){
    let f = returnFields()


    switch (f.selectAlg.value) {
        case 'fcfs':
            
            break;
    
        default:
            break;
    }
    
}

function searchArrivingProcess(fields, t){
    return fields.processes.filter( e => e.arrive == t )
}


function fcfs(){
    let f = returnFields()
    let t = 0
    let finished = false

    q = []

    while(!finished) {
        q.push(searchArrivingProcess(f, t))

        // Se a fila zerou e não há mais processos a serem executados
        if(q.length == 0 && !(f.processes.find(e => e.finished == false))) {
            finished = true
            break
        }


        if(q[0].remaining == 0) {
            f.processes[q[0].id].tFin = t
            // todo calcular tempos aqui!

            f.processes[q[0].id].totalExec = f.processes[q[0].id].service - f.processes[q[0].id].tEspera
            
            q = q.slice(0, 1) // REMOVE o processo da fila

            f.processes[q[0].id].tIni = t
            f.processes[q[0].id].tEspera = t - f.processes[q[0].id].arrive
            // calc. waiting
        }

        if (t == 0){
            f.processes[q[0].id].tIni = t
            f.processes[q[0].id].tEspera = t - f.processes[q[0].id].arrive
        }
        
        
        // q[0].remaining -
        

        t++;
    }
}



const ctx = document.getElementById('graf_emitido').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
                label: 'Onda Emitida',
                data: array,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointRadius: 0, // Remove os pontos dos dados
                fill: false,
                stepped: false // Adiciona passos para uma onda quadrada
            }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Tempo (ms)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Amplitude'
                },
                suggestedMin: (tipoOnda === "senoidal-retificada" || tipoOnda === "dente-serra") ? 0 : -1,
                suggestedMax: 1
            }
        }
    }})
