 /*
   * Class Events
   * Classe auxiliar para tratamento de eventos.
   */
var Events = function(){
    this.before = [];
    this.after = [];

    this.triggerBefore = function(e) {
        for (callback in this.before) {
            this.before[callback](e);
        }
    }

    this.triggerAfter = function(e) {
        for (callback in this.after) {
            this.after[callback](e);
        }
    }
    
    this.onBefore = function(callback) {
        this.before.push(callback);
    }
    
    this.offBefore = function(key) {
        this.before.slice(key,1);
    }
    
    this.onAfter = function(callback) {
        this.after.push(callback);
    }
    
    this.offAfter = function(key) {
        this.after.slice(key,1);
    }
}

/*
 * @var Memória
 * @type Array
 * Variavel utilizada para emulação de um memória.
 */
var Memoria = new Array(64);

 /*
  * Class CPU
  * Classe para emulação de uma CPU.
  */
var CPU = function(){
    /*
     * @var pc
     * @type integer
     * Contador do programa, possui um tamanho de 6 bits.
     */
    var pc;
    
    /*
     * @var mar
     * @type integer
     * Registrador de endereço, possui um tamanho de 6 bits.
     */
    var mar;
    
    /*
     * @var mbr
     * @type integer
     * Registrador de dados, possui um tamanho de 16 bits.
     */
    var mbr;
    
    /*
     * @var ri
     * @type integer
     * Registrador de instrução, possui um tamanho de 16 bits.
     */
    var ri;
    
    /*
     * @var rst
     * @type integer
     * Registrador de estado, possui um tamanho de 3 bits.
     * estados:
     *      0 - busca
     *      1 - decodificação
     *      2 - execução
     *      3 - stop
     */
    var rst;
    
    /*
     * @var ra
     * @type integer
     * Registrador de dados, possui um tamanho de 16 bits.
     */
    var ra;
    
    /*
     * @var rb
     * @type integer
     * Registrador de dados, possui um tamanho de 16 bits.
     */
    var rb;
    
    /*
     * Class UnidadeBusca
     * Classe responsável pela operação de busca.
     */
    var UnidadeBusca = function(){
        var event = new Events();
        
        return{
            /*
             * @function busca
             * @return void
             * Busca a instrução na memória e carrega os registradores especiais.
             */
            busca: function(){
                // dispara o envento antes da busca
                event.triggerAfter({"ir":ri, "mar":mar, "mbr":mbr, "pc":pc});
                
                if (rst == 0) {
                    mar = pc;
                    mbr = Memoria[pc];
                    ri = mbr;
                }
                else{
                    ri = Memoria[pc];
                }
                
                
                //dispara o evento apos a busca
                event.triggerBefore({"ir":ri, "mar":mar, "mbr":mbr, "pc":pc});
            },
             /*
             * @function events
             * @return Event
             * Método auxiliar para interagir com a interface do usuário.
             */
            events: function(){
                return event;
            }
            
        }
    }();
    
     /*
     * Class Decodificador
     * Classe responsável pela decodificação das instruções.
     */
    var Decodificador = function(){
        
        var event = new Events();
        
        var mask = {
            "instruction": 0b1110000000000000,
            "instFlag"   : 0b1000000000000000,
            "op1"        : 0b0001111110000000,
            "op2"        : 0b0000000000111111,
            "opFlag"     : 0b0000000001000000
        };
        
        return{
            instrucao : undefined,
            instFlag : undefined,
            op1 : undefined,
            op2 : undefined,
            opFlag : undefined,
            /*
             * @function decodificar
             * @return void
             * Decodifica o instrução presente na registrador ri.
             */
            decodificar: function(){
                // dispara o envento antes da decodificação
                event.triggerAfter({});            
                // decodifica a instrução
                Decodificador.instrucao = (ri & mask.instruction) >> 13;
                // decodifica o tipo de instrução
                Decodificador.instFlag = (ri & mask.instFlag) >> 15;
                // Efetua a mascara para obter a identificação do registrador e desloca 7 bits para direita
                Decodificador.op1 = (ri & mask.op1) >> 7;
                // Efetua a mascara para obter a identificação do registrador ou endereço de memória
                Decodificador.op2 = ri & mask.op2;
                // Efetua a mascara para identificar se 'src' se refere a um registrador ou um imediato
                Decodificador.opFlag = (ri & mask.opFlag) >> 6;
                
                //dispara o evento após a decodificação
                event.triggerBefore({});
            },
             /*
             * @function events
             * @return Event
             * Método auxiliar para interagir com a interface do usuário.
             */
            events: function(){
                return event;
            }
        }
    }();

    /*
     * Class UnidadeExecucao
     * Classe responsável pela execução das instruções.
     */
    var UnidadeExecucao = function(){
        var event = new Events();
        var instFlag;
        var op1;
        var op2;
        var opFlag;
        return{
            executar: function(){
                // dispara o envento antes da execução
                event.triggerAfter({"ra":ra, "rb":rb});
                
                switch (Decodificador.instrucao) {
                    case 0b000:
                        UnidadeExecucao.add();
                        break;
                    case 0b001:
                        UnidadeExecucao.sub();
                        break;
                    case 0b010:
                        UnidadeExecucao.and();
                        break;
                    case 0b011:
                        UnidadeExecucao.not();
                        break;
                    case 0b100:
                        UnidadeExecucao.mov();
                        break;
                    case 0b101:
                        UnidadeExecucao.jmp();
                        break;
                    case 0b110:
                        UnidadeExecucao.str();
                        break;
                    case 0b111:
                        UnidadeExecucao.hlt();
                        break;
                }
                
                // dispara o envento ao final da execução
                event.triggerBefore({"ra":ra, "rb":rb});
                // atualiza o contador de programa, com exceção para a instrução hlt. 
                if (Decodificador.instrucao != 0b111)
                    ++pc;
                
            },
            add: function(){
                var
                    dest,    // Armazena o valor do registrador de destino
                    src,    // Armazena o valor do registrador fonte
                    op1,    // Armazena o valor do primeiro operando
                    op2,    // Armazena o valor do segundo operando
                    opFlag; // bit para identificar se o operando é um registrador ou um imediato

                // obtem o registrador (operando 1)
                dest = Decodificador.op1;
                // Obtem o valor do registrador
                op1 = UnidadeExecucao.getRegistrador(dest);
                // Obtem o registrador ou endereço de memória
                src = Decodificador.op2;
                // Obtem o flag do operador para identificar se 'src' se refere a um registrador ou um imediato
                opFlag = Decodificador.opFlag;
                // Obtem o valor do segundo operando baseado na flag
                if (opFlag){ // Caso em que o operando é um imediato
                    // Atualiza o pc com o endereço das dados
                    pc = src;
                    // Busca os dados na memória
                    UnidadeBusca.busca();
                    // Coloca os dados no operando 2
                    op2 = ri
                    // Atualiza os registradores para a instrução anterior
                    pc = mar;
                    ri = mbr;
                }
                else // caso em que o operando é um registrador
                    op2 = UnidadeExecucao.getRegistrador(src);
                
                // Carrega os valores na ULA
                ULA.ura = op1;
                ULA.urb = op2;
                // Passa a instrução para ULA
                ULA.executar(Decodificador.instrucao);
                // Atualiza o valor do registrador de destino com o resultado da operação
                UnidadeExecucao.setRegistrador(dest, ULA.uab);
            },
            sub: function(){
                var
                    dest,    // Armazena o valor do registrador de destino
                    src,    // Armazena o valor do registrador fonte
                    op1,    // Armazena o valor do primeiro operando
                    op2,    // Armazena o valor do segundo operando
                    opFlag; // bit para identificar se o operando é um registrador ou um imediato

                // obtem o registrador (operando 1)
                dest = Decodificador.op1;
                // Obtem o valor do registrador
                op1 = UnidadeExecucao.getRegistrador(dest);
                // Obtem o registrador ou endereço de memória
                src = Decodificador.op2;
                // Obtem o flag do operador para identificar se 'src' se refere a um registrador ou um imediato
                opFlag = Decodificador.opFlag;
                // Obtem o valor do segundo operando baseado na flag
                if (opFlag){ // Caso em que o operando é um imediato
                    // Atualiza o pc com o endereço das dados
                    pc = src;
                    // Busca os dados na memória
                    UnidadeBusca.busca();
                    // Coloca os dados no operando 2
                    op2 = ri
                    // Atualiza os registradores para a instrução anterior
                    pc = mar;
                    ri = mbr;
                }
                else // caso em que o operando é um registrador
                    op2 = UnidadeExecucao.getRegistrador(src);
                
                // Carrega os valores na ULA
                ULA.ura = op1;
                ULA.urb = op2;
                // Passa a instrução para ULA
                ULA.executar(Decodificador.instrucao);
                // Atualiza o valor do registrador de destino com o resultado da operação
                UnidadeExecucao.setRegistrador(dest, ULA.uab);
            },
            and: function(){
                var
                    dest,    // Armazena o valor do registrador de destino
                    src,    // Armazena o valor do registrador fonte
                    op1,    // Armazena o valor do primeiro operando
                    op2,    // Armazena o valor do segundo operando
                    opFlag; // bit para identificar se o operando é um registrador ou um imediato

                // obtem o registrador (operando 1)
                dest = Decodificador.op1;
                // Obtem o valor do registrador
                op1 = UnidadeExecucao.getRegistrador(dest);
                // Obtem o registrador ou endereço de memória
                src = Decodificador.op2;
                // Obtem o flag do operador para identificar se 'src' se refere a um registrador ou um imediato
                opFlag = Decodificador.opFlag;
                // Obtem o valor do segundo operando baseado na flag
                if (opFlag){ // Caso em que o operando é um imediato
                    // Atualiza o pc com o endereço das dados
                    pc = src;
                    // Busca os dados na memória
                    UnidadeBusca.busca();
                    // Coloca os dados no operando 2
                    op2 = ri
                    // Atualiza os registradores para a instrução anterior
                    pc = mar;
                    ri = mbr;
                }
                else // caso em que o operando é um registrador
                    op2 = UnidadeExecucao.getRegistrador(src);
                
                // Carrega os valores na ULA
                ULA.ura = op1;
                ULA.urb = op2;
                // Passa a instrução para ULA
                ULA.executar(Decodificador.instrucao);
                // Atualiza o valor do registrador de destino com o resultado da operação
                UnidadeExecucao.setRegistrador(dest, ULA.uab);
            },
            not: function(){
                var
                    dest,    // Armazena a identificação do registrador de destino
                    op1;    // Armazena o valor do operando

                // obtem o registrador (operando 1)
                dest = Decodificador.op1;
                // Obtem o valor do registrador
                op1 = UnidadeExecucao.getRegistrador(dest);
                // Carrega os valores na ULA
                ULA.ura = op1;
                // Passa a instrução para ULA
                ULA.executar(Decodificador.instrucao);
                // Atualiza o valor do registrador de destino com o resultado da operação
                UnidadeExecucao.setRegistrador(dest, ULA.uab);
            },
            mov: function(){
                var
                    dest,    // Armazena o valor do registrador de destino
                    src,    // Armazena o valor do registrador fonte
                    op2,    // Armazena o valor do segundo operando
                    opFlag; // bit para identificar se o operando é um registrador ou um imediato

                // Efetua a mascara para obter a identificação do registrador
                dest = Decodificador.op1;
                // Efetua a mascara para obter a identificação do registrador ou endereço de memória
                src = Decodificador.op2;
                // Efetua a mascara para identificar se 'src' se refere a um registrador ou um imediato
                opFlag = Decodificador.opFlag;
                // Obtem o valor do segundo operando baseado na flag
                if (opFlag){
                     // Atualiza o pc com o endereço das dados
                    pc = src;
                    // Busca os dados na memória
                    UnidadeBusca.busca();
                    // Coloca os dados no operando 2
                    op2 = ri
                    // Atualiza os registradores para a instrução anterior
                    pc = mar;
                    ri = mbr;
                }
                else
                    op2 = UnidadeExecucao.getRegistrador(src);
                // Atualiza o valor do registrador de destino com o valor recebido
                UnidadeExecucao.setRegistrador(dest, op2);             
                
            },
            jmp: function(){
                var end;
                // obtem o endereço para salto
                end = Decodificador.op1;
                // Atualiza o contador de programa com o endereço do salto
                pc = end;
                // Busca a instrução no endereço do salto
                UnidadeBusca.busca();
                // Decodificação da instrução
                Decodificador.decodificar();
                // Execução da instrução
                UnidadeExecucao.executar();
                // Restaura os resgitradores
                pc = mar;
                ri = mbr;
            },
            str: function(){
                var
                    dest,    // Armazena o valor do registrador de destino
                    src,    // Armazena o valor do registrador fonte
                    op2,    // Armazena o valor do segundo operando
                    opFlag; // bit para identificar se o operando é um registrador ou um imediato

                // Efetua a mascara para obter a identificação do registrador
                dest = Decodificador.op1;
                // Efetua a mascara para obter a identificação do registrador ou endereço de memória
                op2 = src = Decodificador.op2;
                // Efetua a mascara para identificar se 'src' se refere a um registrador ou um imediato
                opFlag = Decodificador.opFlag;
                // Obtem o valor do segundo operando baseado na flag
                if (!opFlag)
                    op2 = UnidadeExecucao.getRegistrador(src);
                // Carrega o endereço de memória com o valor recebido
                Memoria[dest] = op2;             
                
            },
            hlt: function(){
                rst = 3;
            },
            
            /*
             * @function getRegistrador
             * @param {integer} reg - identificação do registrador
             * @return integer
             * Retorna o valor armazenado no registrador informado.
             */
            getRegistrador: function(reg){
                return reg == 0b000000 ? ra : rb;
            },
            /*
             * @function setRegistrador
             * @param {integer} reg - identificação do registrador
             * @param {integer} valor - novo valor do registrador
             * @return void
             * Atualiza o valor do registrador informado.
             */
            setRegistrador: function(reg, valor){
                switch (reg) {
                    case 0:
                        ra = valor;
                        break;
                    case 1:
                        rb = valor;
                        break;
                }
            },
            /*
             * @function events
             * @return Event
             * Método auxiliar para interagir com a interface do usuário.
             */
            events: function(){
                return event;
            }
            
        }
        
    }();

     /*
     * Class ULA
     * Classe responsável pela execução das instruções logicas e aritmeticas.
     */
    var ULA = function(){
        var event = new Events();
        return{
            ura:0,
            urb:0,
            uab:0,
            flag:0b00,
            executar:function(instrucao){
                // dispara o envento no inicio da execução
                event.triggerAfter({"ra":ra, "rb":rb});
                
                switch (instrucao) {
                    case 0b000:
                        ULA.add();
                        break;
                    case 0b001:
                        ULA.sub();
                        break;
                    case 0b010:
                        ULA.and();
                        break;
                    case 0b011:
                        ULA.not();
                        break;
                }
                
                // dispara o envento ao final da execução
                event.triggerBefore({"ra":ra, "rb":rb});
            },
            updateFlag: function(){
                if (ULA.uab == 0) {
                    ULA.flag = 0b10;
                }
                else if(ULA.uab < 0){
                    ULA.flag = 0b01;
                }
            },
            add: function(){
                ULA.uab = ULA.ura + ULA.urb;
                ULA.updateFlag();
            },
            sub: function(){
                ULA.uab = ULA.ura - ULA.urb;
                ULA.updateFlag();
            },
            and: function(){
                ULA.uab = ULA.ura & ULA.urb;
                ULA.updateFlag();
            },
            not: function(){
                ULA.uab = !ULA.ura;
                ULA.updateFlag();
            },
             /*
             * @function events
             * @return Event
             * Método auxiliar para interagir com a interface do usuário.
             */
            events: function(){
                return event;
            }
        }
    }();
    
    
    return {
        stopEvent: new Events(),
        resetEvent : new Events(),
        execution: true,
        init: function(){
            mar = undefined;
            mbr = undefined;
            ir = undefined;
            pc = 0;
            rst = 0
            ra = 0;
            rb = 0;
            CPU.execution = true;
            return CPU.controle();
        },
        controle: function(){
           var loop = setInterval(function() {
                switch (rst) {
                    case 0:
                        UnidadeBusca.busca();
                        rst = 1;
                        break;
                    case 1:
                        Decodificador.decodificar();
                        rst = 2;
                        break;
                    case 2:
                        UnidadeExecucao.executar();
                        rst == 3 ? rst = 3: rst = 0;
                        break;
                    case 3:
                        // stop (instrução hlt) - para a execução
                        CPU.stopEvent.triggerAfter();
                        CPU.stopEvent.triggerBefore();
                        CPU.stopEvent.offBefore(0);
                        break;
                    
                }
                if (!CPU.execution) {
                    window.clearInterval(loop);
                }
            },2000);
        },
        reset: function(){
            CPU.resetEvent.triggerAfter();
            CPU.execution = false;
            Memoria = new Array(64);
            CPU.resetEvent.triggerBefore();
        }, 
        getEvents: function(){
            return {"busca" :UnidadeBusca.events(), "decodificador": Decodificador.events(), "execucao":UnidadeExecucao.events(), "ula":ULA.events(),"stop":CPU.stopEvent, "reset":CPU.resetEvent};
        }
    }
}();

 
/*
 * Class Compilador
 * Classe responsável por compilar as instruções passadas pelo usuário
 * convertendo-as no seu respectivo binario
 */
var Compilador = function(){
    var instrucao ={
        "add": 0b0000000000000000,
        "sub": 0b0010000000000000,
        "and": 0b0100000000000000,
        "not": 0b0110000000000000,
        "mov": 0b1000000000000000,
        "jmp": 0b1010000000000000,
        "str": 0b1100000000000000,
        "hlt": 0b1110000000000000
    };
    var registrador ={
        "ra": true,
        "rb": true,
        "op1":{
            "ra":  0b0000000000000000,
            "rb":  0b0000000010000000
        },
        "op2":{
            "ra":  0b0000000000000000,
            "rb":  0b0000000000000001
        }
    };
    var error = {
        "line": undefined,
        "erro": false
    };
    
    var event = new Events();
    
    var type = undefined;
    /*
     * @function processInstruction
     * @param {string} instruction
     * @return Array|null
     * Realiza a separação da instrução e dos operandos
     */
    var processInstruction = function(instruction){
        // obtendo a instrução
        var inst = instruction.substring(0, 3);
        inst.toLowerCase();
        // obtendo o(s) operador(es)
        var operators = instruction.substring(3);
        operators = operators.trim();
        // se a instrução tiver mais de um operando
        if (operators.indexOf(',') > 0) {
            operators = operators.split(',');
            // se a instrução tiver mais de 2 operandos
            if (operators.length > 2) {
                return null;
            } else {
                operators[0] = (operators[0]).trim();
                operators[0] = (operators[0]).toLowerCase();
                operators[1] = (operators[1]).trim();
                operators[1] = (operators[1]).toLowerCase();
          
                return [inst, operators[0], operators[1]];

            }
        }
        // se a instrução tiver apenas um operando
        else if(operators != ""){
            return [inst, operators.toLowerCase()];
        }
        // se a instrução não tiver operando Ex: hlt
        else{
            return [inst];
        }
    }
    /*
     * @function process
     * @param {string} instruction
     * @return Array|null
     * Processa uma instrução
     */
    var process = function(instruction){
        return processInstruction(instruction);
        
    };
    /*
     * @function checkInstruction
     * @param {string} inst
     * @return boolean
     * Verifica se a intrução informada é valida
     */
    var checkInstruction = function(inst){
        if (instrucao[inst] == undefined)
            return false;
        return true;
    };
    /*
     * @function checkRegister
     * @param {string} reg
     * @return boolean
     * Verifica se o registrador é valido
     */
    var checkRegister = function(reg){
        if (registrador[reg] == undefined)
            return false;
        return true;
    };
    /*
     * @function isImediate
     * @param {string} op
     * @return boolean
     * Verifica se a o operando é um imediato
     */
    var isImediate = function(op){
        var regex = /\[([0-9]+)\]/;
        var matches = op.match(regex);
        if (matches != null)
            return true;
        return false;
    };
    /*
     * @function etcheckInstruction
     * @param {string} inst
     * @return integer|null
     * Retorna o valor em binario de uma instrução
     */
    var getInstruction = function(inst){
        if (inst != undefined && checkInstruction(inst))
            return instrucao[inst];
        return null;
    };
    /*
     * @function getRegistrador
     * @param {string} op
     * @param {string} reg
     * @return integer|null
     * Retorna o valor em binario de um registrador
     */
    var getRegister = function(op, reg){
        if (reg != undefined && checkRegister(reg))
            return registrador[op][reg];
        return null;
    };
    /*
     * @function getImediate
     * @param {string} op
     * @return integer|null
     * Retorna o valor em binario de um imediato
     */
    var getImediate = function(op){
        var regex = /\[([0-9]+)\]/;
        var matches = op.match(regex);
        if (matches != null)
            return (parseInt(matches[1]));
        return null;
    };
    
    return{
        /*
        * @function init
        * @return void
        * Obtem o codigo do usuario e inicia a compilação
        */
        init: function(){
            //var code = $('#code').val().split('\n');((editor.getValue()).trim()).split("\n")
            var code = ((editor.getValue()).trim()).split('\n');
            Compilador.compile(code);
            if (error.erro) {
                alert("Verifique o código há um erro na linha:" + error.line);
            }
        },
        /*
        * @function init
        * @param {string} code
        * @return void
        * Realiza a compilação
        */
        compile: function(code){
            // dispara o envento na inicio da compilação
            event.triggerAfter();
            for (var i = 0; i < code.length; i++) {
                // separa a instrução e o(s) operando(s)
                var result = process(code[i]);
                if (result != null) {
                    // verifica se a instrucao é valida
                    if (result.length > 0 && checkInstruction(result[0])) {
                        // verifica se existe o operando 1 e se é um registrador valido
                        if (result.length > 1 && checkRegister(result[1])) {
                            // verifica se existe o operando 2
                            if (result.length > 2 && result[2] != undefined) {
                                // verifica se é um imediato
                                if (isImediate(result[2])) {
                                    Memoria[i] = getInstruction(result[0]) + getRegister('op1', result[1]) + (getImediate(result[2]) + 0b0000000001000000);
                                } else { // se for um registrador
                                    Memoria[i] = getInstruction(result[0]) + getRegister('op1', result[1]) + getRegister('op2', result[2]);
                                }
                            } else{ // caso a instrução só tenha um operando
                                Memoria[i] = getInstruction(result[0]) + getRegister('op1', result[1]);
                            }
                        }
                        // execção para as instruçõo str
                        else if (result[0] == "str") {
                            if (isImediate(result[1])) {
                                result[1] = getImediate(result[1]);
                            }
                            if (checkRegister(result[2])) {
                                Memoria[i] = getInstruction(result[0]) + ((0b0000000000000000 + result[1]) << 7) + parseInt(result[2]);
                            }else{
                                Memoria[i] = getInstruction(result[0]) + ((0b0000000000000000 + result[1]) << 7) + (0b0000000001000000 + parseInt(result[2]));
                            }
                        }
                        // execção para as instruçõa jmp
                        else if (result[0] == "jmp") {
                            Memoria[i] = getInstruction(result[0]) + ((0b0000000000000000 + result[1]) << 7);
                        }
                        else{ // caso a instrução não tenha operandos
                            Memoria[i] = getInstruction(result[0]);
                        }
                    }
                    else{ // se a instrução é invalida
                        error.erro = true;
                        error.line = i+1;
                        break;
                    }
                }
                else{ // se a instrução é nula
                    error.erro = true;
                    error.line = i + 1;
                    break;
                }
            }
            // dispara o evento ao final da compilação
            event.triggerBefore();
        },
        /*
        * @function getError
        * @return Object
        * Retorna os erros
        */
        getError: function(){
            return error;
        },
        /*
        * @function getEvents
        * @return Object
        * Retorna os eventos
        */
        getEvents:function(){
            return event;
        }
    }
}();
