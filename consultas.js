const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    password: "inzane76",
    host: "localhost",
    database: "skatepark",
    port: 5432,
});

async function getUsuarios() {
    const result = await pool.query('SELECT * FROM skaters');
    return result.rows;
}

async function nuevoUsuario(email, nombre, password, anos_exp, especialidad, foto) {
    const result = await pool.query(
        `INSERT INTO skaters(email, nombre, password, anos_experiencia, especialidad, foto, estado) 
        VALUES('${email}', '${nombre}', '${password}', ${anos_exp}, '${especialidad}', '${foto}', false) RETURNING *`
    );
    const usuario = result.rows[0];
    return usuario;
}

async function eliminarUsuario(id) {
    const consulta = {
        text: `DELETE FROM skaters WHERE id = $1`,
        values: [id],
    };

    console.log("id eliminar : ", id);
    try {
        const result = await pool.query(consulta);
        console.log("result.rows : ", result.rows);
        return result.rows;
    } catch (e) {
        throw e.detail;
    }
}

async function editUsuario(id, usuario) {
    const values = Object.values(usuario);
    values.push(id);
    const consulta = {
        text: `UPDATE skaters SET nombre = $1, password = $2, anos_experiencia = $3, especialidad = $4 WHERE id = $5`,
        values,
    };
    try {
        const result = await pool.query(consulta);
        return result;
    } catch (e) {
        return e;
    }
}

async function getUsuario(email, password) {
    const result = await pool.query(
        `SELECT * FROM skaters WHERE email = '${email}' AND password = '${password}'`
    );
    return result.rows[0];
}

async function setUsuarioStatus(id, estado) {
    const result = await pool.query(
        `UPDATE skaters SET estado = ${estado} WHERE id = ${id} RETURNING *`
    );
    const usuario = result.rows[0];
    return usuario;
}

module.exports = { nuevoUsuario, getUsuarios, setUsuarioStatus, getUsuario, eliminarUsuario, editUsuario }