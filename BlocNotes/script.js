// ==========================================
// 1. CONFIGURATION DU CODE D'ACCÈS GLOBAL
// ==========================================
const CODE_SECRET = "77DEVad8"; 
const lockScreen = document.getElementById('lock-screen');
const codeInput = document.getElementById('code-input');
const submitBtn = document.getElementById('submit-code-btn');
const errorMessage = document.getElementById('error-message');

function verifierCode() {
    if (codeInput.value === CODE_SECRET) {
        lockScreen.style.display = 'none';
        lockScreen.setAttribute('data-status', 'unlocked'); 
        
        if (Object.keys(dossiers).length === 0) {
            dossiers["Général"] = { texte: "", couleur: "green", date: obtenirDateActuelle(), prive: false, code: "" };
            localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
            rafraichirAffichageDossiers();
        }
        
        const premierDossier = Object.keys(dossiers)[0];
        selectionnerDossier(premierDossier);
    } else {
        errorMessage.innerText = "⚠️ CODE INCORRECT ACCÈS REFUSÉ";
        codeInput.value = "";
        codeInput.focus();
    }
}

submitBtn.addEventListener('click', verifierCode);
codeInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') verifierCode(); 
});


// ==========================================
// 2. GESTION DES ONGLETS (BLOC-NOTES / MAGASIN)
// ==========================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active-content'));
        button.classList.add('active');
        const targetId = button.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-content');
    });
});


// ==========================================
// 3. LOGIQUE DES DOSSIERS DE NOTES (AVEC COMPTEURS, DATE & PRIVÉ)
// ==========================================
let dossiers = {}; 
let dossierActuel = null;
let couleurSelectionnee = "green"; 
let dossiersDeverrouilles = []; // Stocke temporairement les dossiers débloqués pendant la session

const folderListHtml = document.getElementById('folder-list');
const currentFolderTitle = document.getElementById('current-folder-title');
const lastUpdatedZone = document.getElementById('last-updated-zone');
const noteZone = document.getElementById('note-zone');
const clearBtn = document.getElementById('clear-btn');

const charCountHtml = document.getElementById('char-count');
const wordCountHtml = document.getElementById('word-count');

// Éléments du déverrouillage de dossier
const folderUnlockZone = document.getElementById('folder-unlock-zone');
const folderUnlockInput = document.getElementById('folder-unlock-input');
const folderUnlockBtn = document.getElementById('folder-unlock-btn');
const folderUnlockError = document.getElementById('folder-unlock-error');

function obtenirDateActuelle() {
    const maintenant = new Date();
    const jour = String(maintenant.getDate()).padStart(2, '0');
    const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
    const annee = maintenant.getFullYear();
    const heures = String(maintenant.getHours()).padStart(2, '0');
    const minutes = String(maintenant.getMinutes()).padStart(2, '0');
    const secondes = String(maintenant.getSeconds()).padStart(2, '0');
    return `${jour}/${mois}/${annee} à ${heures}:${minutes}:${secondes}`;
}

window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('mesDossiersCyber');
    if (savedData) {
        dossiers = JSON.parse(savedData);
        Object.keys(dossiers).forEach(cle => {
            if (typeof dossiers[cle] === "string") {
                dossiers[cle] = { texte: dossiers[cle], couleur: "green", date: obtenirDateActuelle(), prive: false, code: "" };
            }
            if (!dossiers[cle].date) dossiers[cle].date = obtenirDateActuelle();
            if (dossiers[cle].prive === undefined) {
                dossiers[cle].prive = false;
                dossiers[cle].code = "";
            }
        });
        rafraichirAffichageDossiers();
    }

    const savedProducts = localStorage.getItem('mesProduitsMagasin');
    if (savedProducts) {
        produitsMagasin = JSON.parse(savedProducts);
    } else {
        produitsMagasin = [{ nom: "Chaise SIHOO M18", prix: "149,99 €", lien: "https://www.amazon.fr", image: "https://via.placeholder.com/120" }];
        localStorage.setItem('mesProduitsMagasin', JSON.stringify(produitsMagasin));
    }
    rafraichirMagasin();
});

function rafraichirAffichageDossiers() {
    folderListHtml.innerHTML = "";
    Object.keys(dossiers).forEach(nomDossier => {
        const li = document.createElement('li');
        li.classList.add('folder-item', 'anime-apparition'); 
        
        const couleurDossier = dossiers[nomDossier].couleur || "green";
        li.classList.add(`folder-cyber-${couleurDossier}`);
        
        if (nomDossier === dossierActuel) li.classList.add('active-folder');
        
        const spanNom = document.createElement('span');
        // Ajoute un cadenas si le dossier est privé
        const iconeprive = dossiers[nomDossier].prive ? "🔒 " : "📁 ";
        spanNom.innerText = `${iconeprive}${nomDossier}`;
        li.appendChild(spanNom);
        
        const btnSuppr = document.createElement('button');
        btnSuppr.classList.add('delete-folder-btn');
        btnSuppr.innerText = "[X]";
        
        btnSuppr.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`⚠️ ATTENTION : Supprimer définitivement le dossier [${nomDossier}] ?`)) {
                delete dossiers[nomDossier];
                localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
                if (dossierActuel === nomDossier) {
                    dossierActuel = null;
                    noteZone.value = "";
                    noteZone.disabled = true;
                    folderUnlockZone.style.display = 'none';
                    noteZone.style.display = 'block';
                    currentFolderTitle.innerText = "Sélectionnez ou créez un dossier";
                    lastUpdatedZone.innerText = "";
                    mettreAJourCompteurs();
                }
                rafraichirAffichageDossiers();
            }
        });
        
        li.appendChild(btnSuppr);
        spanNom.addEventListener('click', () => { selectionnerDossier(nomDossier); });
        folderListHtml.appendChild(li);
    });
}

function selectionnerDossier(nomDossier) {
    dossierActuel = nomDossier;
    currentFolderTitle.innerText = `📝 DOSSIER : ${nomDossier.toUpperCase()}`;
    lastUpdatedZone.innerText = `SYS_SYNC : Dernière modification le ${dossiers[nomDossier].date}`;
    folderUnlockError.innerText = "";
    folderUnlockInput.value = "";

    // Vérification si le dossier est verrouillé
    if (dossiers[nomDossier].prive && !dossiersDeverrouilles.includes(nomDossier)) {
        // C'est privé et pas encore déverrouillé dans cette session
        noteZone.style.display = 'none';
        folderUnlockZone.style.display = 'block';
        noteZone.disabled = true;
        noteZone.value = "";
        mettreAJourCompteurs();
    } else {
        // C'est public ou déjà déverrouillé
        folderUnlockZone.style.display = 'none';
        noteZone.style.display = 'block';
        noteZone.disabled = false;
        noteZone.value = dossiers[nomDossier].texte;
        noteZone.focus();
        mettreAJourCompteurs();
    }
    rafraichirAffichageDossiers();
}

// Bouton de décryptage du dossier
folderUnlockBtn.addEventListener('click', validerCodeDossier);
folderUnlockInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') validerCodeDossier(); });

function validerCodeDossier() {
    if (!dossierActuel) return;
    const codeAttendu = dossiers[dossierActuel].code;
    if (folderUnlockInput.value === codeAttendu) {
        dossiersDeverrouilles.push(dossierActuel); // Mémorise le déverrouillage
        folderUnlockZone.style.display = 'none';
        noteZone.style.display = 'block';
        noteZone.disabled = false;
        noteZone.value = dossiers[dossierActuel].texte;
        noteZone.focus();
        mettreAJourCompteurs();
    } else {
        folderUnlockError.innerText = "❌ CLÉ DE SÉCURITÉ INCORRECTE - ACCÈS REJETÉ";
        folderUnlockInput.value = "";
        folderUnlockInput.focus();
    }
}

function mettreAJourCompteurs() {
    if(!charCountHtml || !wordCountHtml) return;
    const texte = noteZone.value;
    const nbCaracteres = texte.length;
    charCountHtml.innerText = `${nbCaracteres} caractère${nbCaracteres > 1 ? 's' : ''}`;
    const mots = texte.trim().split(/\s+/);
    const nbMots = texte.trim() === "" ? 0 : mots.length;
    wordCountHtml.innerText = `${nbMots} mot${nbMots > 1 ? 's' : ''}`;
}

noteZone.addEventListener('input', () => {
    if (dossierActuel) {
        const nouvelleDate = obtenirDateActuelle();
        dossiers[dossierActuel].texte = noteZone.value;
        dossiers[dossierActuel].date = nouvelleDate;
        localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
        lastUpdatedZone.innerText = `SYS_SYNC : Dernière modification le ${nouvelleDate}`;
        mettreAJourCompteurs();
    }
});

clearBtn.addEventListener('click', () => {
    if (!dossierActuel) return;
    if (confirm(`Effacer tout le contenu du dossier [${dossierActuel}] ?`)) {
        const nouvelleDate = obtenirDateActuelle();
        noteZone.value = '';
        dossiers[dossierActuel].texte = '';
        dossiers[dossierActuel].date = nouvelleDate;
        localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
        lastUpdatedZone.innerText = `SYS_SYNC : Dernière modification le ${nouvelleDate}`;
        mettreAJourCompteurs();
    }
});


// ==========================================
// 4. INTERCEPTION DES TOUCHES CLAVIER (DOSSIER "T" & MODE PANIQUE "ALT+P")
// ==========================================
const commandOverlay = document.getElementById('command-overlay');
const commandInput = document.getElementById('command-input');
const colorButtons = document.querySelectorAll('.color-btn');
const privateCheckbox = document.getElementById('private-folder-checkbox');
const folderPasswordGroup = document.getElementById('folder-password-group');
const folderPasswordInput = document.getElementById('folder-password-input');

// Affiche la zone de mot de passe si on coche la case "privé"
privateCheckbox.addEventListener('change', () => {
    if (privateCheckbox.checked) {
        folderPasswordGroup.style.display = 'block';
        folderPasswordInput.focus();
    } else {
        folderPasswordGroup.style.display = 'none';
        folderPasswordInput.value = "";
    }
});

colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        colorButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        couleurSelectionnee = btn.getAttribute('data-color');
    });
});

document.addEventListener('keydown', (e) => {
    // Si l'application est verrouillée, on bloque les commandes
    if (lockScreen.getAttribute('data-status') !== 'unlocked') return; 

    // 🕵️‍♂️ MODE PANIQUE : Alt + P
    if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); 
        
        // Sécurisation immédiate des données en session
        dossiersDeverrouilles = []; 
        noteZone.value = "";
        noteZone.disabled = true;
        currentFolderTitle.innerText = "Sélectionnez ou créez un dossier";
        lastUpdatedZone.innerText = "";
        mettreAJourCompteurs();
        
        // Verrouillage de l'écran principal
        lockScreen.removeAttribute('data-status');
        lockScreen.style.display = 'flex';
        
        // Reset du formulaire d'entrée global
        codeInput.value = "";
        errorMessage.innerText = "";
        codeInput.focus();
        return; 
    }

    // OUVERTURE DE L'OVERLAY "T" (Uniquement hors des zones de saisie)
    if (e.key.toLowerCase() === 't' && 
        document.activeElement !== noteZone && 
        document.activeElement !== commandInput && 
        document.activeElement !== folderPasswordInput && 
        document.activeElement !== folderUnlockInput && 
        document.activeElement !== codeInput && 
        document.activeElement.tagName !== 'INPUT') {
        
        e.preventDefault(); 
        commandOverlay.style.display = 'flex';
        commandInput.focus();
    }

    // Fermeture de l'overlay avec ÉCHAP
    if (e.key === 'Escape') fermerCommande();
});

commandInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') validerCreationDossier(); });
folderPasswordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') validerCreationDossier(); });

function validerCreationDossier() {
    const nomDossier = commandInput.value.trim();
    const estPrive = privateCheckbox.checked;
    const codeDossier = folderPasswordInput.value.trim();

    if (nomDossier !== "") {
        if (estPrive && codeDossier === "") {
            alert("⚠️ Veuillez définir un code secret pour ce dossier privé !");
            folderPasswordInput.focus();
            return;
        }

        if (!dossiers[nomDossier]) {
            dossiers[nomDossier] = { 
                texte: "", 
                couleur: couleurSelectionnee, 
                date: obtenirDateActuelle(),
                prive: estPrive,
                code: codeDossier
            };
            localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
        }
        fermerCommande();
        selectionnerDossier(nomDossier); 
    }
}

function fermerCommande() {
    commandOverlay.style.display = 'none';
    commandInput.value = "";
    folderPasswordInput.value = "";
    privateCheckbox.checked = false;
    folderPasswordGroup.style.display = 'none';
    colorButtons.forEach(b => b.classList.remove('selected'));
    if(colorButtons.length > 0) colorButtons[0].classList.add('selected');
    couleurSelectionnee = "green";
}

// ==========================================
// 5. GESTION DYNAMIQUE DU MAGASIN
// ==========================================
let produitsMagasin = [];
const shopContainer = document.getElementById('shop-products-container');
const addProductBtn = document.getElementById('add-product-btn');
const shopNameInput = document.getElementById('shop-name');
const shopPriceInput = document.getElementById('shop-price');
const shopLinkInput = document.getElementById('shop-link');
const shopImgInput = document.getElementById('shop-img');

function rafraichirMagasin() {
    if (!shopContainer) return;
    shopContainer.innerHTML = "";
    produitsMagasin.forEach((prod, index) => {
        const card = document.createElement('div');
        card.classList.add('product-card', 'anime-apparition');
        const btnDelProd = document.createElement('button');
        btnDelProd.classList.add('delete-product-btn');
        btnDelProd.innerText = "[X]";
        btnDelProd.addEventListener('click', () => {
            if(confirm(`Supprimer ${prod.nom} ?`)) {
                produitsMagasin.splice(index, 1);
                localStorage.setItem('mesProduitsMagasin', JSON.stringify(produitsMagasin));
                rafraichirMagasin();
            }
        });
        card.appendChild(btnDelProd);
        const img = document.createElement('img');
        img.src = prod.image || "https://via.placeholder.com/120";
        card.appendChild(img);
        const h3 = document.createElement('h3');
        h3.innerText = prod.nom;
        card.appendChild(h3);
        const priceDiv = document.createElement('div');
        priceDiv.classList.add('product-price');
        priceDiv.innerText = prod.prix || prod.price;
        card.appendChild(priceDiv);
        const buyBtn = document.createElement('button');
        buyBtn.classList.add('buy-btn');
        buyBtn.innerText = "Voir sur Amazon";
        buyBtn.style.width = "100%";
        buyBtn.addEventListener('click', () => { window.open(prod.lien || "https://www.amazon.fr", '_blank'); });
        card.appendChild(buyBtn);
        shopContainer.appendChild(card);
    });
}

if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        const nom = shopNameInput.value.trim();
        const prix = shopPriceInput.value.trim();
        if (nom === "" || prix === "") { alert("⚠️ Nom et prix obligatoires !"); return; }
        produitsMagasin.push({ nom, prix, lien: shopLinkInput.value.trim(), image: shopImgInput.value.trim() });
        localStorage.setItem('mesProduitsMagasin', JSON.stringify(produitsMagasin));
        shopNameInput.value = ""; shopPriceInput.value = ""; shopLinkInput.value = ""; shopImgInput.value = "";
        rafraichirMagasin();
    });
}

// ==========================================
// 6. LOGIQUE DE L'ASSISTANT TERMINAL (MIS À POUR AVEC /TEMPLATE)
// ==========================================
const terminalLog = document.getElementById('terminal-log');
const terminalInput = document.getElementById('terminal-input');

if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const ligneSaisie = terminalInput.value.trim(); // Variable corrigée
            if (ligneSaisie === "") return;

            // 1. Afficher la commande tapée par l'utilisateur dans le log
            ajouterLigneTerminal(`> ${ligneSaisie}`, "#ffffff");
            terminalInput.value = "";

            // 2. Traitement de la commande
            const argumentsCmd = ligneSaisie.split(" ");
            const commande = argumentsCmd[0].toLowerCase();

            switch (commande) {
                case '/aide':
                    ajouterLigneTerminal("--- COMMANDES DISPONIBLES ---", "#ffcc00");
                    ajouterLigneTerminal("/aide : Affiche ce menu d'assistance.", "#00ff66");
                    ajouterLigneTerminal("/stats : Analyse la base de données globale de tes dossiers.", "#00ff66");
                    ajouterLigneTerminal("/recherche [mot] : Scanne tous les dossiers pour trouver ce mot-clé.", "#00ff66");
                    ajouterLigneTerminal("/template [devoirs/reunion] : Injecte un gabarit prêt à remplir dans le dossier ouvert.", "#00ff66");
                    ajouterLigneTerminal("/export : Télécharge une sauvegarde complète du système (.json).", "#00ff66");
                    ajouterLigneTerminal("/import : Restaure tes données à partir d'un fichier de sauvegarde.", "#00ff66");
                    ajouterLigneTerminal("/system : Lance un diagnostic des composants virtuels.", "#00ff66");
                    ajouterLigneTerminal("/crypto : Suggère une clé de chiffrement aléatoire forte.", "#00ff66");
                    ajouterLigneTerminal("/matrix : Lance un flux de données binaires simulé.", "#00ff66");
                    ajouterLigneTerminal("/meteo : Rapporte les conditions climatiques du cyber-secteur.", "#00ff66");
                    ajouterLigneTerminal("/calc [calcul] : Effectue une opération mathématique rapide (Ex: /calc 5*12).", "#00ff66");
                    ajouterLigneTerminal("/lock : Force le verrouillage immédiat du système central.", "#00ff66");
                    ajouterLigneTerminal("/clear : Nettoie l'écran du terminal.", "#00ff66");
                    break;

                case '/stats':
                    const totalDossiers = Object.keys(dossiers).length;
                    let totalCaracteres = 0;
                    let privesCount = 0;

                    Object.keys(dossiers).forEach(cle => {
                        totalCaracteres += dossiers[cle].texte.length;
                        if (dossiers[cle].prive) privesCount++;
                    });

                    ajouterLigneTerminal("--- STATISTIQUES LOGICIEL ---", "#00f0ff");
                    ajouterLigneTerminal(`• Dossiers système : ${totalDossiers}`, "#00ff66");
                    ajouterLigneTerminal(`• Dossiers sécurisés [🔒] : ${privesCount}`, "#ff0055");
                    ajouterLigneTerminal(`• Volume data total : ${totalCaracteres} caractères stockés`, "#00ff66");
                    break;

                case '/recherche':
                    const motRecherche = argumentsCmd.slice(1).join(" ").trim().toLowerCase();
                    if (!motRecherche) {
                        ajouterLigneTerminal("⚠️ Usage : /recherche [mot]", "#ff0055");
                    } else {
                        ajouterLigneTerminal(`🔍 SCAN RÉSEAU SYSTÈME POUR : "${motRecherche.toUpperCase()}"...`, "#00f0ff");
                        let dossiersTrouves = 0;

                        Object.keys(dossiers).forEach(nomDossier => {
                            const contenuDossier = dossiers[nomDossier].texte.toLowerCase();
                            const nomDossierMin = nomDossier.toLowerCase();

                            if (contenuDossier.includes(motRecherche) || nomDossierMin.includes(motRecherche)) {
                                const icone = dossiers[nomDossier].prive ? "🔒" : "📁";
                                ajouterLigneTerminal(`  [CORRESPONDANCE] ${icone} Dossier : ${nomDossier}`, "#ffcc00");
                                dossiersTrouves++;
                            }
                        });

                        if (dossiersTrouves === 0) {
                            ajouterLigneTerminal("❌ AUCUN RÉSULTAT CORRESPONDANT.", "#ff0055");
                        } else {
                            ajouterLigneTerminal(`✅ RECHERCHE TERMINÉE : ${dossiersTrouves} dossier(s) détecté(s).`, "#00ff66");
                        }
                    }
                    break;

                case '/template':
                    const typeTemplate = argumentsCmd[1] ? argumentsCmd[1].toLowerCase() : null;
                    
                    if (!currentFolder) {
                        ajouterLigneTerminal("⚠️ ERREUR : Veuillez d'abord ouvrir ou créer un dossier de notes.", "#ff0055");
                        break;
                    }

                    if (typeTemplate === "devoirs") {
                        const squeletteDevoirs = `🎯 OBJECTIF GLOBAL :\n- \n\n📚 MATIÈRE : \n- \n\n⏳ DATE LIMITE : JJ/MM/2026\n\n🛠️ TO-DO LIST :\n[ ] Étape 1 : Lire le cours\n[ ] Étape 2 : Faire les exercices\n[ ] Étape 3 : Relire les fiches\n\n📝 NOTES COMPLÉMENTAIRES :\n`;
                        dossiers[currentFolder].texte = squeletteDevoirs;
                        noteZone.value = squeletteDevoirs;
                        localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
                        ajouterLigneTerminal(`✅ GABARIT [DEVOIRS] INJECTÉ DANS "${currentFolder.toUpperCase()}".`, "#00ff66");
                        
                    } else if (typeTemplate === "reunion") {
                        const squeletteReunion = `📅 COMPTE-RENDU DE RÉUNION\nSujet : \nDate : 11/06/2026\n\n👥 PARTICIPANTS :\n- \n\n📌 POINTS ABORDÉS :\n1. \n2. \n3. \n\n🚀 ACTIONS À PRENDRE :\n- [ ] Participant A : \n- [ ] Participant B : \n\n🔮 PROCHAINE ÉCHÉANCE : \n`;
                        dossiers[currentFolder].texte = squeletteReunion;
                        noteZone.value = squeletteReunion;
                        localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
                        ajouterLigneTerminal(`✅ GABARIT [RÉUNION] INJECTÉ DANS "${currentFolder.toUpperCase()}".`, "#00ff66");
                        
                    } else {
                        ajouterLigneTerminal("⚠️ Usage : /template devoirs OR /template reunion", "#ff0055");
                    }
                    break;

                case '/export':
                    ajouterLigneTerminal("💾 PRÉPARATION DU PAQUET DE SAUVEGARDE...", "#00f0ff");
                    try {
                        const donnéesGlobales = {
                            dossiers: dossiers,
                            magasin: JSON.parse(localStorage.getItem('mesProduitsMagasin')) || []
                        };
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(donnéesGlobales, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", "cyber_mainframe_backup.json");
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                        ajouterLigneTerminal("✅ ARCHIVE SYSTÈME TÉLÉCHARGÉE AVEC SUCCÈS.", "#00ff66");
                    } catch (err) {
                        ajouterLigneTerminal("❌ ÉCHEC DE L'EXPORTATION DES DONNÉES.", "#ff0055");
                    }
                    break;

                case '/import':
                    ajouterLigneTerminal("📥 OUVERTURE DU PORT D'ENTRÉE DATA...", "#ffcc00");
                    const inputFichier = document.createElement('input');
                    inputFichier.type = 'file';
                    inputFichier.accept = '.json';
                    
                    inputFichier.onchange = e => {
                        const fichier = e.target.files[0];
                        const reader = new FileReader();
                        reader.readAsText(fichier, 'UTF-8');
                        
                        reader.onload = readerEvent => {
                            try {
                                const donnéesImportées = JSON.parse(readerEvent.target.result);
                                if (donnéesImportées.dossiers) {
                                    dossiers = donnéesImportées.dossiers;
                                    localStorage.setItem('mesDossiersCyber', JSON.stringify(dossiers));
                                    if (donnéesImportées.magasin) {
                                        localStorage.setItem('mesProduitsMagasin', JSON.stringify(donnéesImportées.magasin));
                                    }
                                    ajouterLigneTerminal("✅ RESTRUCTURATION COMPLÈTE TERMINÉE. ACTUALISATION...", "#00ff66");
                                    setTimeout(() => { location.reload(); }, 1500);
                                } else {
                                    ajouterLigneTerminal("❌ FORMAT DE FICHIER INVALIDE.", "#ff0055");
                                }
                            } catch (err) {
                                ajouterLigneTerminal("❌ ERREUR DE LECTURE DU FICHIER JSON.", "#ff0055");
                            }
                        }
                    };
                    inputFichier.click();
                    break;

                case '/system':
                    ajouterLigneTerminal("🖥️ DIAGNOSTIC MATÉRIEL EN COURS...", "#00f0ff");
                    setTimeout(() => {
                        const utilisationProcesseur = Math.floor(Math.random() * 20) + 5;
                        ajouterLigneTerminal(`• CYBER_CPU CORE : OPÉRATIONNEL (Charge : ${utilisationProcesseur}%)`, "#00ff66");
                        ajouterLigneTerminal(`• BUFFER MEMORY : STABLE (127.0.0.1 // LOCAL_STORAGE)`, "#00ff66");
                        ajouterLigneTerminal("• SÉCURITÉ PARE-FEU : ACTIF [PROTOCOLE MAINFRAME]", "#00ff66");
                        ajouterLigneTerminal("• STATUT GLOBAL : TOUS LES SYSTÈMES SONT NOMINAUX.", "#ffcc00");
                    }, 500);
                    break;

                case '/crypto':
                    const caracteresPossibles = "ABCDEF-GHIJK-LMNOP-QRSTU-VWXYZ-0123456789";
                    let cleGeneree = "";
                    for (let i = 0; i < 12; i++) {
                        const indexAlea = Math.floor(Math.random() * caracteresPossibles.length);
                        cleGeneree += caracteresPossibles[indexAlea];
                    }
                    ajouterLigneTerminal("--- CONFIGURATEUR CRITICAL_KEY ---", "#ff0055");
                    ajouterLigneTerminal(`Suggestion de clé robuste : ${cleGeneree}`, "#00ff66");
                    break;

                case '/matrix':
                    ajouterLigneTerminal("⚡ CONNEXION AU PROTOCOLE MATRIX...", "#00ff66");
                    let compteur = 0;
                    const intervalle = setInterval(() => {
                        let ligneBinaire = "";
                        for(let i=0; i<40; i++) {
                            ligneBinaire += Math.random() > 0.5 ? "1" : "0";
                        }
                        ajouterLigneTerminal(ligneBinaire, "#00ff66");
                        compteur++;
                        if(compteur >= 10) {
                            clearInterval(intervalle);
                            ajouterLigneTerminal("🔓 FLUX TERMINÉ AVEC SUCCÈS.", "#00ff66");
                        }
                    }, 150);
                    break;

                case '/meteo':
                    const villes = ["Néo-Paris", "Night City", "Zion", "Neo-Tokyo"];
                    const climats = ["Pluie acide", "Brume néon", "Orage magnétique", "Pollution orange"];
                    const villeAlea = villes[Math.floor(Math.random() * villes.length)];
                    const climatAlea = climats[Math.floor(Math.random() * climats.length)];
                    const degres = Math.floor(Math.random() * 15) + 25;

                    ajouterLigneTerminal(`📡 RAPPORTS SATELLITE POUR : ${villeAlea.toUpperCase()}`, "#00f0ff");
                    ajouterLigneTerminal(`• Conditions : ${climatAlea}`, "#ffcc00");
                    ajouterLigneTerminal(`• Température : ${degres}°C`, "#ffcc00");
                    break;

                case '/calc':
                    const calcul = argumentsCmd[1]; 
                    if (!calcul) {
                        ajouterLigneTerminal("⚠️ Usage : /calc [opération] (Ex: /calc 5+5)", "#ff0055");
                    } else {
                        try {
                            const resultat = Function(`return ${calcul}`)();
                            ajouterLigneTerminal(`🖥️ RÉSULTAT : ${calcul} = ${resultat}`, "#00ff66");
                        } catch (erreur) {
                            ajouterLigneTerminal("❌ OPÉRATION INVALIDE. Utilisez +, -, * ou /", "#ff0055");
                        }
                    }
                    break;

                case '/lock':
                    ajouterLigneTerminal("🔒 VERROUILLAGE FORCÉ DU SYSTÈME...", "#ff0055");
                    setTimeout(() => {
                        dossiersDeverrouilles = []; 
                        noteZone.value = "";
                        noteZone.disabled = true;
                        currentFolderTitle.innerText = "Sélectionnez ou créez un dossier";
                        lastUpdatedZone.innerText = "";
                        mettreAJourCompteurs();
                        lockScreen.removeAttribute('data-status');
                        lockScreen.style.display = 'flex';
                        codeInput.value = "";
                        errorMessage.innerText = "";
                        codeInput.focus();
                    }, 800);
                    break;

                case '/clear':
                    terminalLog.innerHTML = `<div style="color: #888;">[CONSOLE NETTOYÉE] Saisissez /aide pour continuer.</div>`;
                    break;

                default:
                    ajouterLigneTerminal(`❌ COMMANDE INCONNUE : "${commande}". Tape /aide pour voir les options.`, "#ff0055");
                    break;
            }
        }
    });
}

function ajouterLigneTerminal(texte, couleur = "#00ff66") {
    if (!terminalLog) return;
    const div = document.createElement('div');
    div.style.color = couleur;
    div.style.marginBottom = "5px";
    div.innerText = texte;
    terminalLog.appendChild(div);
    terminalLog.scrollTop = terminalLog.scrollHeight;
}

// ==========================================
// 7. LOGIQUE DES GRAPHES STATISTIQUES (AVEC SAUVEGARDE ET RESET)
// ==========================================
const dataInput = document.getElementById('graph-data-input');
const generateBtn = document.getElementById('generate-graph-btn');
const ctx = document.getElementById('cyber-canvas-chart');

// Nouveaux éléments pour la sauvegarde
const saveGraphZone = document.getElementById('save-graph-zone');
const graphNameInput = document.getElementById('graph-name-input');
const saveGraphBtn = document.getElementById('save-graph-btn');
const savedGraphsList = document.getElementById('saved-graphs-list');

let monGraphique = null; 
let donneesActuelles = []; // Stocke temporairement les chiffres du graphique en cours

// Charger les graphiques sauvegardés au démarrage
let graphiquesSauvegardes = JSON.parse(localStorage.getItem('mesGraphiquesCyber')) || {};

// Fonction pour afficher la liste des graphiques enregistrés
function afficherGraphiquesSauvegardes() {
    if (!savedGraphsList) return;
    savedGraphsList.innerHTML = "";
    
    const cles = Object.keys(graphiquesSauvegardes);
    if (cles.length === 0) {
        savedGraphsList.innerHTML = `<div style="color: #666;">[AUCUNE DONNÉE ARCHIVÉE]</div>`;
        return;
    }
    
    cles.forEach(nom => {
        const div = document.createElement('div');
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.background = "#111";
        div.style.padding = "10px";
        div.style.borderLeft = "3px solid #ff0055";
        
        div.innerHTML = `
            <span style="color: #00ff66; cursor: pointer;" class="load-graph-trigger" data-name="${nom}">📊 ${nom} (${graphiquesSauvegardes[nom].length} pts)</span>
            <button class="delete-graph-btn" data-name="${nom}" style="background: none; border: none; color: #ff0055; cursor: pointer; font-family: monospace;">[SUPPRIMER]</button>
        `;
        savedGraphsList.appendChild(div);
    });

    // Événement pour recharger un graphique au clic sur son nom
    document.querySelectorAll('.load-graph-trigger').forEach(el => {
        el.addEventListener('click', () => {
            const nom = el.getAttribute('data-name');
            dataInput.value = graphiquesSauvegardes[nom].join(', ');
            generateBtn.click();
        });
    });

    // Événement pour supprimer un graphique sauvegardé
    document.querySelectorAll('.delete-graph-btn').forEach(el => {
        el.addEventListener('click', () => {
            const nom = el.getAttribute('data-name');
            delete graphiquesSauvegardes[nom];
            localStorage.setItem('mesGraphiquesCyber', JSON.stringify(graphiquesSauvegardes));
            afficherGraphiquesSauvegardes();
        });
    });
}

// Génération du graphique
if (generateBtn && ctx) {
    generateBtn.addEventListener('click', () => {
        const texteSaisi = dataInput.value.trim();
        if (texteSaisi === "") {
            alert("⚠️ Veuillez entrer des chiffres séparés par des virgules !");
            return;
        }

        donneesActuelles = texteSaisi.split(',')
            .map(item => item.trim().replace(/−/g, '-'))
            .map(item => parseFloat(item))
            .filter(nombre => !isNaN(nombre));

        if (donneesActuelles.length === 0) {
            alert("⚠️ Aucun nombre valide détecté.");
            return;
        }

        const etiquettes = donneesActuelles.map((_, index) => `DATA_${index + 1}`);

        if (monGraphique) { monGraphique.destroy(); }

        monGraphique = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: etiquettes,
                datasets: [{
                    label: 'FLUX DE DONNÉES',
                    data: donneesActuelles,
                    borderColor: '#00ff66', 
                    backgroundColor: 'rgba(0, 255, 102, 0.05)', 
                    borderWidth: 2,
                    tension: 0.2, 
                    pointBackgroundColor: '#ff0055', 
                    pointBorderColor: '#ff0055',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                scales: {
                    x: { ticks: { color: '#00ff66', font: { family: 'monospace' } }, grid: { color: 'rgba(0, 255, 102, 0.1)' } },
                    y: { ticks: { color: '#00ff66', font: { family: 'monospace' } }, grid: { color: 'rgba(0, 255, 102, 0.1)' } }
                },
                plugins: { legend: { labels: { color: '#00ff66', font: { family: 'monospace' } } } }
            }
        });

        // On affiche la zone pour pouvoir lui donner un nom et le sauvegarder
        saveGraphZone.style.display = 'flex';
    });
}

// Action du bouton Sauvegarder
if (saveGraphBtn) {
    saveGraphBtn.addEventListener('click', () => {
        const nomGraphique = graphNameInput.value.trim();
        
        if (nomGraphique === "") {
            alert("⚠️ Veuillez donner un nom à votre statistique avant d'enregistrer !");
            graphNameInput.focus();
            return;
        }

        // Enregistrement dans notre objet global et dans le LocalStorage
        graphiquesSauvegardes[nomGraphique] = donneesActuelles;
        localStorage.setItem('mesGraphiquesCyber', JSON.stringify(graphiquesSauvegardes));

        // Rafraîchir la liste affichée en bas
        afficherGraphiquesSauvegardes();

        // --- REMISE À ZÉRO COMPLÈTE ---
        if (monGraphique) {
            monGraphique.destroy(); // Efface le dessin du graphique
            monGraphique = null;
        }
        donneesActuelles = [];
        dataInput.value = ""; // Vide la suite de chiffres
        graphNameInput.value = ""; // Vide le champ de nom
        saveGraphZone.style.display = 'none'; // Masque la zone de sauvegarde
        
        alert(`✅ Graphique "${nomGraphique}" enregistré avec succès et console réinitialisée !`);
    });
}

// Initialisation de la liste au chargement
afficherGraphiquesSauvegardes();

// ==========================================
// 8. GESTION DU CONFIGURATEUR DE THÈMES D'INTERFACES
// ==========================================
const boutonsTheme = document.querySelectorAll('.theme-btn');

// 1. Charger automatiquement le thème sauvegardé au démarrage
const themeSauvegarde = localStorage.getItem('monCyberTheme') || 'matrix';
document.documentElement.setAttribute('data-theme', themeSauvegarde);

// 2. Écouter les clics sur les boutons de changement de thème
if (boutonsTheme) {
    boutonsTheme.forEach(bouton => {
        bouton.addEventListener('click', () => {
            const cibleTheme = bouton.getAttribute('data-theme');
            
            // Applique le thème sur la structure HTML globale
            document.documentElement.setAttribute('data-theme', cibleTheme);
            
            // Enregistre définitivement le choix dans le navigateur
            localStorage.setItem('monCyberTheme', cibleTheme);
        });
    });
}