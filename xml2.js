const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Função para formatar data em ISO
function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


// Função para buscar o arquivo .lrc mais recente em uma estrutura de artistas/álbuns
function getMostRecentLRCFile(dirPath) {
    let mostRecentFile = null;
    let mostRecentTime = 0;

    const artistFolders = fs.readdirSync(dirPath);

    artistFolders.forEach(artistFolder => {
        const artistPath = path.join(dirPath, artistFolder);

        if (fs.lstatSync(artistPath).isDirectory()) {
            const albumFolders = fs.readdirSync(artistPath);

            albumFolders.forEach(albumFolder => {
                const albumPath = path.join(artistPath, albumFolder);

                if (fs.lstatSync(albumPath).isDirectory()) {
                    const files = fs.readdirSync(albumPath).filter(file => file.endsWith('.lrc'));

                    files.forEach(file => {
                        const filePath = path.join(albumPath, file);
                        const stats = fs.statSync(filePath);

                        // Verifica se este arquivo é o mais recente
                        if (stats.mtimeMs > mostRecentTime) {
                            mostRecentTime = stats.mtimeMs;
                            mostRecentFile = filePath;
                        }
                    });
                }
            });
        }
    });

    return mostRecentFile;
}

// Função para ler e processar o arquivo .lrc
function parseLRC(filePath) {
    return new Promise((resolve, reject) => {
        const lines = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseFloat(match[2]);
                const timeInSeconds = minutes * 60 + seconds;
                const text = match[3].trim();
                lines.push({ time: timeInSeconds, text });
            }
        });

        rl.on('close', () => resolve(lines));
        rl.on('error', (err) => reject(err));
    });
}

// Pegar automaticamente o arquivo .lrc mais recente na pasta Lyrics/
const lyricsFolderPath = 'C:/Users/teteu/OneDrive/Área de Trabalho/projetos vs-code/codigos/1056+1056/spotify-lyric-downloader/Lyrics';
const lrcFilePath = getMostRecentLRCFile(lyricsFolderPath);

if (!lrcFilePath) {
    console.error('Nenhum arquivo .lrc encontrado nas subpastas.');
    process.exit(1);
}

// Extrair o nome do arquivo (sem extensão) para gerar o XML com o mesmo nome do arquivo .lrc
const fileName = path.basename(lrcFilePath, '.lrc');

// Função para criar XML a partir do .lrc
function createXMLFromLRC(lines, outputFilePath, title = `${fileName}`, width = 720, height = 720, fps = 48) {
    const exportDate = formatDateToISO(new Date());

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xmlContent += `<!--\nCreated by Alight Motion (http://alightmotion.com)\nExported: ${exportDate}\n5.0.270.1002578 (1002351)\n-->\n`;
    xmlContent += `<scene title="${title}" width="${width}" height="${height}" exportWidth="${width}" exportHeight="${height}" precompose="dynamicResolution" bgcolor="#ff000000" fps="${fps}" totalTime="${Math.floor(lines[lines.length - 1].time * 1000)}" modifiedTime="${Date.now()}" amver="1002351" ffver="106" am="com.alightcreative.motioo/5.0.270.1002578" amplatform="android" retime="freeze" retimeAdaptFPS="false">\n`;

    // Adicionando bookmarks com base nos tempos das linhas LRC
    lines.forEach((line, index) => {
        const startTime = Math.floor(line.time * 1000);
        xmlContent += `  <bookmark t="${startTime}" />\n`;
    });

    // Adicionando shapes e efeitos estáticos
    xmlContent += `  <shape id="3130604" label="Retângulo 2" startTime="0" endTime="${Math.floor(lines[lines.length - 1].time * 1000)}" fillType="color" mediaFillMode="fill" s=".rect">\n`;
    xmlContent += `    <transform>\n`;
    xmlContent += `      <location value="360.000000,360.000000,0.000000" />\n`;
    xmlContent += `      <scale value="3.600000,3.600000" />\n`;
    xmlContent += `    </transform>\n`;
    xmlContent += `    <fillColor value="#ff000000" />\n`;
    xmlContent += `    <effect id="com.alightcreative.effects.fibersglow" locallyApplied="true">\n`;
    xmlContent += `      <property name="COLORS" type="color" value="#ffff4d4d" />\n`;
    xmlContent += `      <property name="COLORS2" type="color" value="#ff194d99" />\n`;
    xmlContent += `      <property name="autop" type="bool" value="true" />\n`;
    xmlContent += `      <property name="PROGRESS" type="float" value="1.000000" />\n`;
    xmlContent += `      <property name="SPEED" type="float" value="0.130000" />\n`;
    xmlContent += `      <property name="scale" type="float" value="1.000000" />\n`;
    xmlContent += `      <property name="angle" type="float" value="0.000000" />\n`;
    xmlContent += `      <property name="stretch" type="vec2" value="2.490000,1.000000" />\n`;
    xmlContent += `      <property name="alpha" type="float" value="0.040000" />\n`;
    xmlContent += `      <property name="hardness" type="float" value="1.000000" />\n`;
    xmlContent += `      <property name="blendMode" type="int" value="3" />\n`;
    xmlContent += `      <property name="GRADMAP" type="bool" value="false" />\n`;
    xmlContent += `      <property name="color1" type="color" value="#ff000000" />\n`;
    xmlContent += `      <property name="color2" type="color" value="#ffffffff" />\n`;
    
    xmlContent += `    </effect>\n`;

    xmlContent += `   <property name="size" type="vec2" value="100.000000,100.000000" />\n`;
    xmlContent += `  </shape>\n`;


    //retangulo arredondado
    xmlContent +=`  <shape id="2920" label="Retângulo arredondado 1" startTime="0" endTime="${Math.floor(lines[lines.length - 1].time * 1000)}" fillType="color" blending="mask" mediaFillMode="fill" s=".roundrect">     \n`;
    xmlContent +=`  <transform> \n`;
    xmlContent +=`    <location value="360.000000,360.000000,0.000000" /> \n`;
    xmlContent +=`    <scale value="3.360000,3.360000" /> \n`;
    xmlContent +=`  </transform> \n`;
    xmlContent +=`  <fillColor value="#ffa563f1" /> \n`;
    xmlContent +=`  <property name="size" type="vec2" value="100.000000,100.000000" /> \n`;
    xmlContent +=`  <property name="cornerRadius" type="float" value="25.000000" /> \n`;
    xmlContent +=`</shape> \n`;

    // Adicionando grupo de embedScene
    xmlContent += `  <embedScene id="3130086" label="Grupo 1" startTime="0" endTime="${Math.floor(lines[lines.length - 1].time * 1000)}" fillType="intrinsic" mediaFillMode="fill">\n`;
    xmlContent += `    <transform>\n`;
    xmlContent += `      <location value="360.000000,360.000000,0.000000" />\n`;
    xmlContent += `      <pivot value="0.000000,171.082520" />\n`;
    xmlContent += `    </transform>\n`;
    xmlContent += `    <fillColor value="#ff000000" />\n`;
    xmlContent += `    <effect id="com.alightcreative.effects.motionblur4" locallyApplied="true">\n`;
    xmlContent += `      <property name="tune" type="float" value="1.000000" />\n`;
    xmlContent +=          `<property name="usePos" type="bool" value="true" /> \n `;
    xmlContent +=          `<property name="useScale" type="bool" value="true" /> \n `;
    xmlContent +=          `<property name="useAngle" type="bool" value="true" /> \n `;
    xmlContent += `    </effect>\n`;



    // efeitos continuação

// Calcula o tempo total em segundos
const totalTimeInSeconds = lines[lines.length - 1].time;

// Converte o tempo total em minutos
const totalTimeInMinutes = totalTimeInSeconds / 60;

// Calcula a fase final multiplicando 3.75 pelo tempo total em minutos
const phaseFinal = 3.75 * totalTimeInMinutes;

xmlContent += `<effect id="com.alightcreative.effects.wavewarp2" locallyApplied="true">\n`;
xmlContent += `  <property name="phase" type="float">\n`;
xmlContent += `    <kf t="-0.000347" v="0.000000" />\n`;
xmlContent += `    <kf t="0.990795" v="${phaseFinal.toFixed(6)}" />\n`;  // Fase final calculada
xmlContent += `  </property>\n`;
xmlContent += `  <property name="a1d" type="float" value="0.000000" />\n`;
xmlContent += `  <property name="m1" type="float">\n`;
xmlContent += `    <kf t="0.000000" v="3.500000" />\n`;
xmlContent += `    <kf t="0.990795" v="3.500000" />\n`;
xmlContent += `  </property>\n`;
xmlContent += `  <property name="m2" type="float" value="2.100000" />\n`;
xmlContent += `  <property name="a2d" type="float" value="90.000000" />\n`;
xmlContent += `  <property name="damping" type="float" value="0.000000" />\n`;
xmlContent += `  <property name="dampingSpace" type="float" value="0.000000" />\n`;
xmlContent += `  <property name="dampingOrigin" type="float" value="0.500000" />\n`;
xmlContent += `  <property name="screenSpace" type="bool" value="false" />\n`;
xmlContent += `</effect>\n`;

    xmlContent += `<effect id="com.alightcreative.effects.hueshift" locallyApplied="true">\n`;
    xmlContent += `  <property name="hue" type="float">\n`;
    xmlContent += `    <kf t="0.009865" v="0.000000" />\n`;
    xmlContent += `    <kf t="0.990795" v="937.000000" />\n`;
    xmlContent += `  </property>\n`;
    xmlContent += `</effect>\n`;
    xmlContent += `<effect id="com.alightcreative.effects.deepglow" locallyApplied="true">\n`;
    xmlContent += `  <property name="strength" type="float" value="0.150000" />\n`;
    xmlContent += `  <property name="rrr" type="float" value="1.500000" />\n`;
    xmlContent += `  <property name="satvib" type="vec2" value="0.000000,1.000000" />\n`;
    xmlContent += `  <property name="hue" type="float" value="360.000000" />\n`;
    xmlContent += `  <property name="oalpha" type="float" value="1.000000" />\n`;
    xmlContent += `  <property name="calpha" type="float" value="1.000000" />\n`;
    xmlContent += `  <property name="sshadow" type="bool" value="false" />\n`;
    xmlContent += `  <property name="power" type="float" value="0.150000" />\n`;
    xmlContent += `  <property name="alphaa" type="float" value="0.750000" />\n`;
    xmlContent += `  <property name="cblend" type="bool" value="false" />\n`;
    xmlContent += `  <property name="color" type="color" value="#ffaa0000" />\n`;
    xmlContent += `  <property name="alpb" type="float" value="0.500000" />\n`;
    xmlContent += `  <property name="thrs" type="bool" value="false" />\n`;
    xmlContent += `  <property name="lowThreshold" type="float" value="0.000000" />\n`;
    xmlContent += `  <property name="highThreshold" type="float" value="1.000000" />\n`;
    xmlContent += `  <property name="feather" type="float" value="3.000000" />\n`;
    xmlContent += `  <property name="iter" type="float" value="1.000000" />\n`;
    xmlContent += `</effect>\n`;
    xmlContent += `<effect id="com.alightcreative.effects.fractalwarp4" locallyApplied="true">\n`;
    xmlContent += `  <property name="offs" type="vec2" value="1110.000000,0.000000" />\n`;
    xmlContent += `  <property name="parr" type="vec2">\n`;
    xmlContent += `    <kf t="0.000347" v="546.000000,0.000000" />\n`;
    xmlContent += `    <kf t="0.426016" v="6000.000000,0.000000" />\n`;
    xmlContent += `  </property>\n`;
    xmlContent += `  <property name="mag" type="float" value="0.015000" />\n`;
    xmlContent += `  <property name="scale" type="float" value="0.980000" />\n`;
    xmlContent += `  <property name="intensity" type="float" value="0.300000" />\n`;
    xmlContent += `  <property name="screenSpace" type="bool" value="false" />\n`;
    xmlContent += `  <property name="octaves" type="float" value="6.000000" />\n`;
    xmlContent += `</effect>\n`;

    xmlContent += ` <scene title="" width="720" height="720" exportWidth="720" exportHeight="720" precompose="dynamicResolution" bgcolor="#00000000" totalTime="${Math.floor(lines[lines.length - 1].time * 1000)}" fps="48" modifiedTime="0" amver="1002351" ffver="106" am="com.alightcreative.motioo/5.0.270.1002578" amplatform="android" retime="off" retimeAdaptFPS="false">\n`;
    // Adicionando as linhas de texto LRC no embedScene com transformações e efeitos
    lines.forEach((line, index) => {
        const startTime = Math.floor(line.time * 1000);
        const endTime = index < lines.length - 1 ? Math.floor(lines[index + 1].time * 1000) : startTime + 3000;

        xmlContent += `    <text id="${3130050 + index}" startTime="${startTime}" endTime="${endTime}" fillType="color" mediaFillMode="fill" size="20.000000" font="imported?name=GothamMediumItalic.ttf" wrapWidth="1819" align="center">\n`;
        xmlContent += `      <transform>\n`;
        xmlContent += `        <location value="360.000000,379.492188,0.000000" />\n`;
        xmlContent += `        <scale value="0.391974,0.391974" />\n`;
        xmlContent += `      </transform>\n`;
        xmlContent += `      <content>${line.text}</content>\n`;
        xmlContent += `    </text>\n`;
    });

    // Adicionando o texto "@hirozn" até o final do vídeo
    const totalDuration = Math.floor(lines[lines.length - 1].time * 1000) + 5000;
    xmlContent += `    <text id="3130049" startTime="0" endTime="${totalDuration}" fillType="color" mediaFillMode="fill" size="18.000000" font="imported?name=SFNSDisplay-Regular.ttf" wrapWidth="512" align="center">\n`;
    xmlContent += `      <transform>\n`;
    xmlContent += `        <location value="360.000000,583.174805,0.000000" />\n`;
    xmlContent += `        <scale value="0.416016,0.416016" />\n`;
    xmlContent += `        <opacity value="0.531250" />\n`;
    xmlContent += `      </transform>\n`;
    xmlContent += `      <content>@hirozn</content>\n`;
    xmlContent += `    </text>\n`;

    xmlContent += `  </scene>\n</embedScene>\n</scene>`;

    fs.writeFileSync(outputFilePath, xmlContent, 'utf8');
}


const xmlOutputFilePath = path.join('G:/Meu Drive/xmls', `${fileName}.xml`);

// Criação da pasta de saída, se não existir
if (!fs.existsSync('G:/Meu Drive/xmls')) {
    fs.mkdirSync('G:/Meu Drive/xmls', { recursive: true });
}

parseLRC(lrcFilePath)
    .then((lines) => createXMLFromLRC(lines, xmlOutputFilePath))
    .catch((err) => console.error('Erro ao processar o arquivo LRC:', err));
