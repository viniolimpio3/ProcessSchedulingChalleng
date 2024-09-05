document.getElementById('tempos-chegada').onchange = changeInput;
document.getElementById('tempos-servico').onchange = changeInput;
document.getElementById('prioridades').onchange = changeInput;
document.getElementById('quantum').onchange = changeInput;

function changeInput(event){

    const input = event.target;
    let regex = new RegExp(/^[0-9]+(?:; ?[0-9]+)*$/);

    // O tempo de serviço não pode ter valor 0
    if(input.id == 'tempos-servico')
        regex = new RegExp(/^[1-9]+(?:; ?[1-9]+)*$/);
    else if (input.id == 'prioridades')
        regex = new RegExp(/^[1-5](?:; ?[1-5])*$/);
    else if (input.id == 'quantum')
        regex = new RegExp(/^[1-9]+$/);

    if(!regex.test(input.value)){
        input.classList.add('is-invalid');
    } else {
        input.classList.remove('is-invalid');
    }
}

document.getElementById('algoritmo').onchange = (event) => {
    const select = event.target;
    const quantumCol = document.getElementById('quantum-col');
    
    if(select.value == 'rr')
        quantumCol.removeAttribute('hidden')
    else 
        quantumCol.setAttribute('hidden', true)

}