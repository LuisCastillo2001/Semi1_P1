import app from "./app.js"

app.listen(app.get("port"), () => {
    console.log(`El servidor corre en el puerto: ${app.get('port')}`)
})
