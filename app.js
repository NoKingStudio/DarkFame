const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

// Chemins vers les fichiers de données
const messagesFilePath = './data/messages.json';

// Chargement des messages existants si le fichier existe
let messages = [];
if (fs.existsSync(messagesFilePath)) {
    messages = JSON.parse(fs.readFileSync(messagesFilePath, 'utf8'));
}

// Serveur HTTP
const server = http.createServer((req, res) => {
    // Routage des requêtes
    if (req.method === 'GET') {
        if (req.url === '/') {
            // Page d'accueil (index.html)
            fs.readFile('./views/forum.html', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Erreur serveur');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } else if (req.url === '/forum') {
            // Page du forum
            fs.readFile('./views/forum.html', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Erreur serveur');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } else if (req.url === '/getMessages') {
            // Récupération des messages
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(messages));
        } else if (req.url.startsWith('/uploads/')) {
            // Gestion des fichiers de pièces jointes
            const filePath = path.join(__dirname, req.url);
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Fichier non trouvé');
                    return;
                }
                const ext = path.extname(filePath);
                const contentType = ext === '.mp3' ? 'audio/mpeg' : 'image/jpeg';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });
        } else if (req.url === '/styles/style.css') {
            // Fichier CSS
            fs.readFile('./styles/style.css', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Erreur serveur');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data);
            });
        } else {
            // Route non trouvée
            res.writeHead(404);
            res.end('Page non trouvée');
        }
    } else if (req.method === 'POST' && req.url === '/postMessage') {
        // Envoi de message
        const form = new formidable.IncomingForm();
        form.uploadDir = path.join(__dirname, '/data/uploads/');
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500);
                res.end('Erreur lors du traitement du formulaire');
                return;
            }

            // Nouveau message
            const newMessage = {
                username: fields.username,
                message: fields.message,
                attachment: null
            };

            // Vérification des pièces jointes (image ou audio)
            if (files.attachment) {
                const fileExt = path.extname(files.attachment.originalFilename).toLowerCase();
                const fileName = `${Date.now()}${fileExt}`;
                const filePath = path.join(form.uploadDir, fileExt === '.mp3' ? 'audio' : 'images', fileName);

                // Déplacement du fichier
                fs.rename(files.attachment.filepath, filePath, (err) => {
                    if (err) {
                        console.error('Erreur lors du déplacement du fichier:', err);
                        res.writeHead(500);
                        res.end('Erreur serveur');
                        return;
                    }
                    newMessage.attachment = `/uploads/${fileExt === '.mp3' ? 'audio' : 'images'}/${fileName}`;
                    messages.push(newMessage);
                    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
                    res.writeHead(302, { 'Location': '/forum' });
                    res.end();
                });
            } else {
                messages.push(newMessage);
                fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
                res.writeHead(302, { 'Location': '/forum' });
                res.end();
            }
        });
    } else {
        // Méthode non supportée
        res.writeHead(405);
        res.end('Méthode non supportée');
    }
});

// Démarrage du serveur
server.listen(3000, () => {
    console.log('Serveur en écoute sur http://localhost:3000');
});
