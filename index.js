// core modules 
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const { error, log } = require('console');



app.set('view engine', 'ejs');
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    fs.readdir('./files', (err, files) => {
        if (err) {
            console.error('Error reading files directory:', err);
            return res.status(500).send('Internal Server Error');
        }

        const notes = [];
        files.forEach(file => {
            const fileContent = fs.readFileSync(`./files/${file}`, 'utf-8');
            try {
                const note = JSON.parse(fileContent);
                notes.push(note);
            } catch (error) {
                console.error(`Error parsing ${file}:`, error);
            }
        });

        res.render('index', { notes: notes });
    });
});

app.get('/:filename', (req, res) => {
    fs.readFile(`./files/${req.params.filename.split('-').join('')}.txt`, "utf-8", (err, filedata) => {
        try {
            const noteData = JSON.parse(filedata);
            if (!noteData) {
                return res.status(404).send('Note not found');
            }
            res.render('detailed', { data: [noteData] });
        } catch (error) {
            console.error('Error parsing note data:', error);
            res.status(500).send('Error parsing note data');
        }
    })
} )


app.post('/create', (req, res) => {
    const note = {
        title: req.body.title.trim(),
        content: req.body.details
    };
    
    fs.writeFile(`files/${req.body.title.split(' ').join("")}.txt`, JSON.stringify(note), "utf-8", (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Error creating file');
        }
        res.redirect('/');
    });
});

app.get('/:deletedfile/completed', (req, res) => {
    const filePath = `files/${req.params.deletedfile}`;
    
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).send('Error deleting file');
        }
        res.redirect('/');
    });
});

app.get('/edit/:editedtitle', (req, res) => {
    res.render('edit', {editTask: req.params.editedtitle.replace(".txt","")});
})

app.post('/edit/:filename', (req, res) => {
    const oldFileName = req.params.filename;
    const oldFilePath = `files/${oldFileName}`;
    const newTitle = req.body.newTitle;
    const newFilePath = `files/${newTitle.split(' ').join('')}.txt`;

    // Read the existing file
    fs.readFile(oldFilePath, 'utf-8', (err, filedata) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }

        try {
            // Parse and update the JSON data
            const noteData = JSON.parse(filedata);
            noteData.title = newTitle;

            // Write to new file then delete old file
            fs.writeFile(newFilePath, JSON.stringify(noteData), 'utf-8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing new file:', writeErr);
                    return res.status(500).send('Error updating file');
                }

                // Delete the old file after successful write
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting old file:', unlinkErr);
                        return res.status(500).send('Error removing old file');
                    }
                    res.redirect('/');
                });
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return res.status(500).send('Error parsing file data');
        }
    });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});