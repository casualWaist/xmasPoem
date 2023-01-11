
/*
Goal here is to make a 3D version of a Shell Silverstein like poem
The site should be able to load all the 3D assets in a timely way that doesn't interrupt the flow
User input should show the poetry
each line should be 11 syllables long
TODO
All models need a second pass to add detail and character
Add a function that calculates the input name's number of syllables and
can choose from several variations of each line to total 11 syllables
*/

import './style.css';
import * as THR from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FontLoader} from "three/addons/loaders/FontLoader.js";
import {TextGeometry} from "three/addons/geometries/TextGeometry.js";
//import {distance} from "three/nodes";

//page and view setup
const app = document.getElementById("app");
document.getElementById("goButton").onclick = beginCheck;
const body = document.body;
const html = document.documentElement;
let docHeight = Math.max( body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight );
body.onscroll = scrollToo;
let started = false;
let finished = false;
let roll = 0;
let rollStart = 0;
let rollEnd = 1000000;

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// calculating window and camera bounds for sync
const visHgtAtZDepth = ( depth, camera ) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if ( depth < cameraOffset ) depth -= cameraOffset;
    else depth += cameraOffset;

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180;

    // Math.abs to ensure the result is always positive
    return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
};

const visWidAtZDepth = ( depth, camera ) => {
    const height = visHgtAtZDepth( depth, camera );
    return height * camera.aspect;
}

// basic environment setup
const scene = new THR.Scene();
const camera = new THR.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
const render = new THR.WebGLRenderer({canvas: document.querySelector('#cgi'),});
render.setPixelRatio(window.devicePixelRatio);
render.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

//lighting
const keyLight = new THR.PointLight(0xffffff, 1, 125);
keyLight.position.set(10, 10, 27);
const fillLight = new THR.PointLight(0xffffff, 0.75, 125);
fillLight.position.set(-10, 15, 32);
const underLight = new THR.PointLight(0xffffff, 0.75, 125);
underLight.position.set(3, -10, 30);
//const backLight = new THR.SpotLight(0xffffff, 0.05, 40, 60, 0.5);
//backLight.position.set(0, 0, 1);
const amiLight = new THR.AmbientLight(0x557C55, 0.5);
scene.add(keyLight);
scene.add(fillLight);
scene.add(underLight);
//scene.add(backLight);
scene.add(amiLight);

const ltGreenMat = new THR.MeshStandardMaterial({color: 0xf2ffe9});
const greenMat = new THR.MeshStandardMaterial({color: 0xa6cf98});
const dkGreenMat = new THR.MeshStandardMaterial({color: 0x557c55});
const redMat = new THR.MeshStandardMaterial({color: 0xdb6b97});

const bgPlane = new THR.PlaneGeometry(visWidAtZDepth(-20, camera), visHgtAtZDepth(-20, camera));
const bGround = new THR.Mesh(bgPlane, ltGreenMat);
bGround.position.set(0, 0, -20);
scene.add(bGround);

//animation variables for timing and geometry
let titleY = 0;
let titleYEnd = 15;
let firstTreeX = visWidAtZDepth(20, camera)*0.4;
let firstTreeXEnd = -4.5;
let ornLineX = visWidAtZDepth(25, camera);
let branchGrabX = -0.4;
let branchGrabY = 0.2;
let braGrabXEnd = 0.8;
let braGrabYEnd = -1.1;
let branchGrabZ = 29.75;
let braGrabZEnd = 29.5;
let stXRot = 1;
let stXRotEnd = 0.4;
let stYRot = -1.57;
let stYRotEnd = 0.6;
let streetX = -12;
let streetXEnd = 15;
let streetY = -2;
let streetYEnd = 3;
let streetZ = 27;
let streetZEnd = 25.5;
let oTableX = 4;
let oTableY = 0.3;
let oTableRot = 0.9;
let oTableXEnd = -4.2;
let oTableRotEnd = 1.57;
let bWrapX = -0.75;
let bWrapY = 1.75;
let bWrapZ = 29.5;
let bWrapYEnd = -1.5;
let bWrapRot = 0.5;
let bWrapRotEnd = 1.75;
let secondX = -8;
let secondY = -2;
let secondXEnd = 7.8;
let secondYEnd = -4;
let secondRot = 0;
let secondRotEnd = 1;
let pokeX = 10.3;
let pokeY = -2;
let pokeRotY = 3.3;
let pokeRotYEnd = 2.8;
let finX = 1;
let finY = -3;
let finZ = 33;
let finXEnd = 0;
let finYEnd = 0;
let finZEnd = -11;
let finXRot = 0;
let finYRot = 0;
let finXRotEnd = 1.57;
let finYRotEnd = 1;
let theEndY = -8
let theEndYEnd = 4;
let bgEnd = 1;

let t1 = 3;  // end of the title. starts hook pass
let t2 = 6;  // end of hook pass. starts street move
let t3 = 19;  // end of street move. start first tree move
let t4 = 25;  // starts ornament line pass
let t5 = 36;  // end of line pass. starts tree spinning up
let t6 = 43;  // end of tree moving up. pause
let t7 = 44;  // move tree out of frame
let t8 = 48;  // end of move tree. start of move table
let t9 = 57;  // end of move table. start of move wrap
let ta = 65;  // end of move wrap. start of move second tree
let tb = 74;  // end of second tree. start of move poke house
let tc = 81;  // end of poke house. start of final
let td = 99;  // final move. the end

// load model functions
const fontLoader = new FontLoader();
let title;
let titleFade = 0;
let theEnd;
let theEndFade = 0;
fontLoader.load('Phenomena Light_Regular.json', function (font) {
    const params = {
        font: font,
        size: 2,
        height: 0.2,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.25,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 6
    }
    const pOGeo = new TextGeometry('Permanent Ornaments', params);
    title = new THR.Mesh(pOGeo, greenMat);
    title.position.set(-9.8, titleY, 10);
    title.material.transparent = true;
    title.material.opacity = 0;
    scene.add(title);
    const tEGeo = new TextGeometry('The End', params);
    theEnd = new THR.Mesh(tEGeo, redMat);
    theEnd.position.set(-3.4, theEndY, 20);
    theEnd.material.transparent = true;
    theEnd.material.opacity = 0;
    scene.add(theEnd);
});

const loader = new GLTFLoader();
let firstTree;
function loadTree() {
    loader.load('cTree.glb', function (cTree) {
        cTree.scene.position.set(firstTreeX, -5, 20);
        cTree.scene.rotation.set(0, 0, 0);
        scene.add(cTree.scene);
        firstTree = cTree;
    }, undefined, function (error) {
        console.error(error);
    });
}
loadTree();

let ornLine;
function loadLine() {
    loader.load('ornamentLine.glb', function (oLine) {
        oLine.scene.position.set(ornLineX, 0, 25);
        oLine.scene.scale.set(4, 4, 4);
        scene.add(oLine.scene);
        ornLine = oLine;
    }, undefined, function (error) {
        console.error(error);
    });
}

let branchGrab;
function loadHooked() {
    loader.load('branchGrab.glb', function (bGrab) {
        bGrab.scene.position.set(branchGrabX, branchGrabY, branchGrabZ);
        bGrab.scene.rotation.set(0, 0, 0);
        scene.add(bGrab.scene);
        branchGrab = bGrab;
    }, undefined, function (error) {
        console.error(error);
    });
}

let streets;
function loadStreet() {
    loader.load('streetCorner.glb', function (stCorn) {
        stCorn.scene.position.set(streetX, streetY, streetZ);
        stCorn.scene.scale.set(6, 6, 6);
        stCorn.scene.rotation.set(stXRot, stYRot, 0);
        scene.add(stCorn.scene);
        streets = stCorn;
    }, undefined, function (error) {
        console.error(error);
    });
}

let table;
function loadTable() {
        loader.load('oTable.glb', function (oTab) {
        oTab.scene.position.set(oTableX, oTableY, 28);
        oTab.scene.rotation.set(oTableRot, 0, 0);
        scene.add(oTab.scene);
        table = oTab;
    }, undefined, function (error) {
        console.error(error);
    });
}

let branchWrap;
function loadWrap() {
    loader.load('branchWrap.glb', function (bRap) {
        bRap.scene.position.set(bWrapX, bWrapY, bWrapZ);
        bRap.scene.rotation.set(0, bWrapRot, 0);
        scene.add(bRap.scene);
        branchWrap = bRap;
    }, undefined, function (error) {
        console.error(error);
    });
}

let secondTree;
function loadSecond() {
    loader.load('secondTree.glb', function (sec) {
        sec.scene.position.set(secondX, secondY, 25);
        sec.scene.rotation.set(0, secondRot, 0);
        scene.add(sec.scene);
        secondTree = sec;
    }, undefined, function (error) {
        console.error(error);
    });
}

let pokeHouse;
function loadPoke() {
    loader.load('pokeHouse.glb', function (poke) {
        poke.scene.position.set(pokeX, pokeY, 25);
        poke.scene.rotation.set(0, pokeRotY, 0);
        scene.add(poke.scene);
        pokeHouse = poke;
    }, undefined, function (error) {
        console.error(error);
    });
}

let finalTree;
function loadFinal() {
    loader.load('finalTree.glb', function (fin) {
        fin.scene.position.set(finX, finY, finZ);
        fin.scene.rotation.set(finXRot, finYRot, 0);
        scene.add(fin.scene);
        finalTree = fin;
    }, undefined, function (error) {
        console.error(error);
    });
}

let name;
//let year;
let ePlace = document.getElementById("errorPlace");

// function for checking the name input and starting the scene
function beginCheck(){
    let checkName = document.getElementById("nameId");
    //let checkYear = document.getElementById("yearId");
    if (checkName.value.length > 15){
        ePlace.innerText = 'Please provide a shorter name';
    }
    else if (checkName.value === ''){
        ePlace.innerText = 'Please choose a name';

    }
    /*else if (!checkYear.value){
        ePlace.innerText = 'Please choose a year';
    }
    else if (checkYear.value > 9900){
        ePlace.innerText = 'Please choose a closer year';
    }*/
    else {
        name = checkName.value;
        //year = checkYear.value;
        started = true;
        fetch('story.html')
            .then ( (r) => { return r.text();  } )
            .then ( (s) => {
                s = s.replaceAll('#name#', name);
                app.innerHTML = s;
            }).then(() => {
                docHeight = Math.max( body.scrollHeight, body.offsetHeight,
                            html.clientHeight, html.scrollHeight, html.offsetHeight );

            });
    }
}

let lineNotLoaded = true;
let hookNotLoaded = true;
let stNotLoaded = true;
let tabNotLoaded = true;
let rapNotLoaded = true;
let secNotLoaded = true;
let pokNotLoaded = true;
let finNotLoaded = true;
function scrollToo(){
    if (started){
        let y = window.scrollY
        let per = (100 * y) / docHeight;  //decimal per. of page
        console.log(y, per);
        if (0 <= per && per <= t1){  //split page into parts by percent
            let place = per * 100 / (t1 * 100);  //get a percent value of the place in the part
            moveTitle(place);
            if (hookNotLoaded){
                hookNotLoaded = false;
                loadHooked();
            }
        }
        else if (t1 < per && per <= t2){
            let place = (per - t1) * 100 / ((t2 - t1) * 100) ;
            hookPass(place);
            if (stNotLoaded){
                stNotLoaded = false;
                loadStreet();
            }
        }
        else if (t2 < per && per <= t3){
            let place = (per - t2) * 100 / ((t3 - t2) * 100);
            moveStreet(place);
        }
        else if (t3 < per && per <= t4){
            let place = (per - t3) * 100 / ((t4 - t3) * 100);
            firstTreeMove(place);
            if (lineNotLoaded){
                lineNotLoaded = false;
                loadLine();
            }
        }
        else if (t4 < per && per <= t5){
            let place = (per - t4) * 100 / ((t5 - t4) * 100);
            lineCrossing(place);
        }
        else if (t5 < per && per <= t6){
            let place = (per - t5) * 100 / ((t6 - t5) * 100);
            secTwo(place);
        }
        else if (t6 < per && per <= t7){
            let place = (per - t6) * 100 / ((t7 - t6) * 100);
            if (tabNotLoaded){
                tabNotLoaded = false;
                loadTable();
            }
        }
        else if (t7 < per && per <= t8){
            let place = (per - t7) * 100 / ((t8 - t7) * 100);
            treeToLine(place);
        }
        else if (t8 < per && per <= t9){
            let place = (per - t8) * 100 / ((t9 - t8) * 100);
            if (rapNotLoaded) {
                rapNotLoaded = false;
                loadWrap();
            }
            moveTable(place);
        }
        else if (t9 < per && per <= ta){
            let place = (per - t9) * 100 / ((ta - t9) * 100);
            moveWrap(place);
            if (secNotLoaded){
                secNotLoaded = false;
                loadSecond();
            }
        }
        else if (ta < per && per <= tb){
            let place = (per - ta) * 100 / ((tb - ta) * 100);
            moveSecond(place);
            if (pokNotLoaded){
                pokNotLoaded = false;
                loadPoke();
            }
        }
        else if (tb < per && per <= tc){
            let place = (per - tb) * 100 / ((tc - tb) * 100);
            if (finNotLoaded){
                finNotLoaded = false;
                loadFinal();
            }
            movePoke(place);
        }
        else if (tc < per && per <= td){
            let place = (per - tc) * 100 / ((td - tc) * 100);
            moveFinal(place);
        }
        if (td * 0.98 < per && per <= td) {
            let place = (per - td * 0.98) * 100 / ((td - td * 0.98) * 100);
            if (!finished) {
                finished = true;
            }
            moveEnd(place);
        }
        roll += y;
    }
}

//animation functions
function percentToValue(percent, current, vRange){
    let x = percent * (vRange[1] - vRange[0]) + vRange[0];
    return x - current;
}

function moveTitle(p){
    title.position.y += percentToValue(p, title.position.y, [titleY, titleYEnd]);
    firstTree.scene.position.x += percentToValue(p, firstTree.scene.position.x, [firstTreeX, 0]);
}

function firstTreeMove(p){
    firstTree.scene.position.z += percentToValue(p, firstTree.scene.position.z, [20, 28]);
}

function secTwo(p){
    firstTree.scene.position.y += percentToValue(p, firstTree.scene.position.y, [-5, -1]);
    firstTree.scene.rotation.y += percentToValue(p, firstTree.scene.rotation.y, [0, 3.14]);
}

function treeToLine(p){
    firstTree.scene.position.x += percentToValue(p, firstTree.scene.position.x, [0, firstTreeXEnd])
}

function lineCrossing(p){
    ornLine.scene.position.x += percentToValue(p, ornLine.scene.position.x, [ornLineX, -(ornLineX*11)]);
}

function hookPass(p){
    branchGrab.scene.position.x += percentToValue(p, branchGrab.scene.position.x, [branchGrabX, braGrabXEnd]);
    branchGrab.scene.position.y += percentToValue(p, branchGrab.scene.position.y, [branchGrabY, braGrabYEnd]);
    branchGrab.scene.position.z += percentToValue(p, branchGrab.scene.position.z, [branchGrabZ, braGrabZEnd]);
}

function moveStreet(p){
    streets.scene.rotation.x += percentToValue(p, streets.scene.rotation.x, [stXRot, stXRotEnd]);
    streets.scene.rotation.y += percentToValue(p, streets.scene.rotation.y, [stYRot, stYRotEnd]);
    streets.scene.position.y += percentToValue(p, streets.scene.position.y, [streetY, streetYEnd]);
    streets.scene.position.x += percentToValue(p, streets.scene.position.x, [streetX, streetXEnd]);
    streets.scene.position.z += percentToValue(p, streets.scene.position.z, [streetZ, streetZEnd]);
}

function moveTable(p){
    table.scene.position.x += percentToValue(p, table.scene.position.x, [oTableX, oTableXEnd]);
    table.scene.rotation.x += percentToValue(p, table.scene.rotation.x, [oTableRot, oTableRotEnd]);
}

function moveWrap(p){
    branchWrap.scene.position.y += percentToValue(p, branchWrap.scene.position.y, [bWrapY, bWrapYEnd]);
    branchWrap.scene.rotation.y += percentToValue(p, branchWrap.scene.rotation.y, [bWrapRot, bWrapRotEnd]);
}

function moveSecond(p){
    secondTree.scene.position.x += percentToValue(p, secondTree.scene.position.x, [secondX, secondXEnd]);
    secondTree.scene.position.y += percentToValue(p, secondTree.scene.position.y, [secondY, secondYEnd]);
    secondTree.scene.rotation.y += percentToValue(p, secondTree.scene.rotation.y, [secondRot, secondRotEnd]);
}

function movePoke(p){
    pokeHouse.scene.position.x += percentToValue(p, pokeHouse.scene.position.x, [pokeX, -pokeX]);
    pokeHouse.scene.rotation.y += percentToValue(p, pokeHouse.scene.rotation.y, [pokeRotY, pokeRotYEnd]);
}

function moveFinal(p){
    finalTree.scene.position.x += percentToValue(p, finalTree.scene.position.x, [finX, finXEnd]);
    finalTree.scene.position.y += percentToValue(p, finalTree.scene.position.y, [finY, finYEnd]);
    finalTree.scene.position.z += percentToValue(p, finalTree.scene.position.z, [finZ, finZEnd]);
    finalTree.scene.rotation.x += percentToValue(p, finalTree.scene.rotation.x, [finXRot, finXRotEnd]);
    finalTree.scene.rotation.y += percentToValue(p, finalTree.scene.rotation.y, [finYRot, finYRotEnd]);
    bGround.position.z += percentToValue(p, bGround.position.z, [-20, bgEnd]);
}

function moveEnd(p){
    theEnd.position.y += percentToValue(p, theEnd.position.y, [theEndY, theEndYEnd]);
}

function animate() {
    requestAnimationFrame(animate);
    render.render(scene, camera);
    if (started && titleFade < 1){
        titleFade += 0.006;
        title.material.opacity = titleFade;
    }
    if (finished && theEndFade < 1){
        theEndFade += 0.006;
        theEnd.material.opacity = theEndFade;
    }
}

render.render(scene, camera);
function reRender(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    render.setSize(window.innerWidth, window.innerHeight);
    bGround.scale.set(visWidAtZDepth(-20, camera), visHgtAtZDepth(-20, camera), 1);
    firstTreeX = visWidAtZDepth(20, camera)*0.4;
    ornLineX = visWidAtZDepth(20, camera)*0.4;
    branchGrabX = visWidAtZDepth(29.75, camera)*0.45;
}
document.body.onresize = reRender;

animate()
