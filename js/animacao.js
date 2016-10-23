// Animação da Interface
(function() {
    var draw = SVG('cpu');

    var est_busca = SVG.get('est-busca');
    var est_stop = SVG.get('est-stop');
    var display_mem = SVG.get('display-mem');

    var reg_ir = SVG.get('text-ir');
    var reg_mbr = SVG.get('text-mbr');
    var reg_mar = SVG.get('text-mar');
    var reg_pc = SVG.get('text-pc');
    var reg_ra = SVG.get('text-ra');
    var reg_rb = SVG.get('text-rb');

    var decodificador = SVG.get('decodificador');
    var un_execucao = SVG.get('un-execucao');
    var ula = SVG.get('ula');

    var events = CPU.getEvents();
    var compileEvent = Compilador.getEvents();

    (events['busca']).onAfter(function(e){
        est_busca.animate(500, '>').attr({
            fill: '#3bbb3b'
        });
    });

    (events['busca']).onBefore(function(e) {
        reg_ir.plain(e.ir);
        reg_mar.plain(e.mar);
        reg_mbr.plain(e.mbr);
        reg_pc.plain(e.pc);
        est_busca.animate(500, '>').attr({
            fill: '#ffffff'
        });
    });
    
    (events['decodificador']).onAfter(function(e) {
        decodificador.animate(500, '>').attr({
            fill: '#3bbb3b'
        });
    });
    
    (events['decodificador']).onBefore(function(e) {  
        decodificador.animate(500, '>').attr({
            fill: '#0071BC'
        });
    });
    
    (events['execucao']).onAfter(function(e) {
        un_execucao.animate(500, '>').attr({
            fill: '#3bbb3b'
        });
    });
    
    (events['execucao']).onBefore(function(e) {
        un_execucao.animate(500, '>').attr({
            fill: '#0071BC'
        });
        
        reg_ra.plain(e.ra);
        reg_rb.plain(e.rb);
    });
    
    (events['ula']).onAfter(function(e) {
        ula.animate(500, '>').attr({
            fill: '#3bbb3b'
        });
    });
    
    (events['ula']).onBefore(function(e) {
        ula.animate(500, '>').attr({
            fill: '#0071BC'
        });
    });
    
    (events['stop']).onBefore(function(e) {
        //CPU.stopEvent.offBefore(0);
        est_stop.animate(500, '>').attr({
            fill: '#3bbb3b'
        });
    });
    
    (events['reset']).onBefore(function(e) {
        est_stop.animate(500, '>').attr({
            fill: '#ffffff'
        });
        
        CPU.stopEvent.onBefore(function(e) {
            //CPU.stopEvent.offBefore(0);
            est_stop.animate(500, '>').attr({
                fill: '#3bbb3b'
            });
        });
        
        reg_ir.plain(0);
        reg_pc.plain(0);
        reg_mbr.plain(0);
        reg_mar.plain(0);
        reg_ra.plain(0);
        reg_rb.plain(0);
    });
    
    compileEvent.onBefore(function(e) {
        for (var i =0; i < Memoria.length; i++) {
           var celula = SVG.get('mem_'+i+'_');
           celula.mouseover(function() {
               this.fill('#3bbb3b');
               var match = (this.id()).match(/^mem\_([0-9]+)\_/);
               display_mem.plain(match[1]+": " +(Memoria[match[1]] == undefined ? 0: Memoria[match[1]]));
           })
           celula.mouseout(function() { this.fill('#B3B3B3'); display_mem.plain(0);})
       }
    });

})();