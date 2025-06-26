import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- Autenticación y usuarios ---
  const [usuario, setUsuario] = useState(null);
  const [registro, setRegistro] = useState({ nombre: '', password: '', confirmar: '' });
  const [login, setLogin] = useState({ nombre: '', password: '' });
  const [errores, setErrores] = useState({});
  const [modo, setModo] = useState('registro'); // 'registro' o 'login'
  const [modalAuth, setModalAuth] = useState(null); // 'registro' | 'login' | null

  // --- Productos globales ---
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ nombre: '', precio: '', descripcion: '', imagen: '', talla: '' });
  const [editIndex, setEditIndex] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fileName, setFileName] = useState('');

  // --- Compras ---
  const [modalCompra, setModalCompra] = useState({ abierto: false, producto: null });
  const [compra, setCompra] = useState({ nombre: '', numero: '', vencimiento: '', cvv: '', direccion: '' });
  const [erroresCompra, setErroresCompra] = useState({});
  const [compraExitosa, setCompraExitosa] = useState(false);

  // --- Pestanas ---
  const [pestana, setPestana] = useState('tus'); // 'tus' o 'otros' o 'busqueda'
  
  // --- Búsqueda ---
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // --- Favoritos ---
  const [favoritos, setFavoritos] = useState([]);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);

  // --- Logout dropdown ---
  const [mostrarLogout, setMostrarLogout] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  // --- Fade global al cerrar sesión ---
  const [fadeLogout, setFadeLogout] = useState(false);

  // Cargar usuario y productos globales al iniciar
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('miropa_usuario_activo'));
    if (user) setUsuario(user);
    const productosGuardados = JSON.parse(localStorage.getItem('miropa_productos_global')) || [];
    setProductos(productosGuardados);
  }, []);

  // Guardar productos globales en localStorage cada vez que cambian
  useEffect(() => {
    if (productos.length > 0) {
      guardarProductosSeguro(productos);
    }
  }, [productos]);

  // Cargar favoritos del usuario al iniciar
  useEffect(() => {
    if (usuario) {
      const favs = JSON.parse(localStorage.getItem('miropa_favoritos_' + usuario.nombre)) || [];
      setFavoritos(favs);
    }
  }, [usuario]);

  // Guardar favoritos en localStorage cuando cambian
  useEffect(() => {
    if (usuario) {
      localStorage.setItem('miropa_favoritos_' + usuario.nombre, JSON.stringify(favoritos));
    }
  }, [favoritos, usuario]);

  // Cerrar logout dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificar si el click fue en el botón de usuario o en el dropdown
      const userButton = event.target.closest('.user-button');
      const logoutDropdown = event.target.closest('.logout-slide-container');
      const logoutButton = event.target.closest('.logout-btn');
      
      // Si el click fue en el botón de usuario, no hacer nada
      if (userButton) {
        return;
      }
      
      // Si el click fue en el dropdown o en el botón de logout, no cerrar
      if (logoutDropdown || logoutButton) {
        return;
      }
      
      // Si el click fue fuera de todo, cerrar el dropdown
      if (mostrarLogout) {
        cerrarLogoutDropdown();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mostrarLogout]);

  // Función para cerrar el dropdown de logout con animación
  const cerrarLogoutDropdown = () => {
    setSlideOut(true);
    setTimeout(() => {
      setMostrarLogout(false);
      setSlideOut(false);
    }, 300);
  };

  // Validar registro
  const validarRegistro = () => {
    const errs = {};
    if (!registro.nombre.trim()) {
      errs.nombre = 'El nombre es obligatorio';
    } else {
      const cuentas = JSON.parse(localStorage.getItem('miropa_cuentas')) || [];
      if (cuentas.find(u => u.nombre === registro.nombre)) {
        errs.nombre = 'Ese nombre de usuario ya existe';
      }
    }
    if (registro.password.length < 6) {
      errs.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!/[A-Z]/.test(registro.password)) {
      errs.password = 'Debe contener al menos una mayúscula';
    }
    if (!/[0-9]/.test(registro.password)) {
      errs.password = 'Debe contener al menos un número';
    }
    if (registro.password !== registro.confirmar) {
      errs.confirmar = 'Las contraseñas no coinciden';
    }
    return errs;
  };

  // Cambios en formularios
  const handleRegistroChange = (e) => {
    setRegistro({ ...registro, [e.target.name]: e.target.value });
  };
  const handleLoginChange = (e) => {
    setLogin({ ...login, [e.target.name]: e.target.value });
  };

  // Registro de usuario
  const handleRegistro = (e) => {
    e.preventDefault();
    const errs = validarRegistro();
    setErrores(errs);
    if (Object.keys(errs).length === 0) {
      const nuevaCuenta = { nombre: registro.nombre, password: registro.password };
      const cuentas = JSON.parse(localStorage.getItem('miropa_cuentas')) || [];
      cuentas.push(nuevaCuenta);
      localStorage.setItem('miropa_cuentas', JSON.stringify(cuentas));
      localStorage.setItem('miropa_usuario_activo', JSON.stringify(nuevaCuenta));
      setUsuario(nuevaCuenta);
    }
  };

  // Login de usuario
  const handleLogin = (e) => {
    e.preventDefault();
    const cuentas = JSON.parse(localStorage.getItem('miropa_cuentas')) || [];
    const user = cuentas.find(u => u.nombre === login.nombre);
    const errs = {};
    if (!user) {
      errs.nombre = 'Usuario no encontrado';
    } else if (user.password !== login.password) {
      errs.password = 'Contraseña incorrecta';
    }
    setErrores(errs);
    if (Object.keys(errs).length === 0) {
      setUsuario(user);
      localStorage.setItem('miropa_usuario_activo', JSON.stringify(user));
      setModalAuth(null);
    }
  };

  // Logout
  const handleLogout = () => {
    setSlideOut(true);
    setFadeLogout(true);
    setTimeout(() => {
      setUsuario(null);
      setFavoritos([]);
      localStorage.removeItem('miropa_usuario_activo');
      setLogin({ nombre: '', password: '' });
      setRegistro({ nombre: '', password: '', confirmar: '' });
      setErrores({});
      setMostrarLogout(false);
      setSlideOut(false);
      setTimeout(() => setFadeLogout(false), 600); // Espera a que termine el fade
      // Cerrar todos los modales/pop-ups
      setModalAuth(null);
      setModalAbierto(false);
      setModalCompra({ abierto: false, producto: null });
      setMostrarFavoritos(false);
      // Limpiar formularios
      setForm({ nombre: '', precio: '', descripcion: '', imagen: '', talla: '' });
      setEditIndex(null);
      setFileName('');
      setCompra({ nombre: '', numero: '', vencimiento: '', cvv: '', direccion: '' });
      setErroresCompra({});
      setCompraExitosa(false);
    }, 300);
  };

  // CRUD productos
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imagen' && files && files[0]) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          // Comprimir la imagen antes de guardarla
          const imagenComprimida = await comprimirImagen(ev.target.result);
          setForm({ ...form, imagen: imagenComprimida });
          setFileName(files[0].name);
        } catch (error) {
          console.error('Error al comprimir imagen:', error);
          // Si falla la compresión, usar la imagen original
          setForm({ ...form, imagen: ev.target.result });
          setFileName(files[0].name);
        }
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm({ ...form, [name]: value });
      if (name === 'imagen') setFileName('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio || !form.imagen || !form.talla) return;
    
    if (editIndex !== null) {
      const nuevosProductos = [...productos];
      nuevosProductos[editIndex] = { ...form, creador: productos[editIndex].creador };
      setProductos(nuevosProductos);
      setEditIndex(null);
    } else {
      // Verificar límite de productos
      if (productos.length >= LIMITE_PRODUCTOS) {
        window.alert(`No se pueden agregar más productos. Límite máximo: ${LIMITE_PRODUCTOS} productos.`);
        return;
      }
      
      const nuevosProductos = [...productos, { ...form, creador: usuario.nombre }];
      setProductos(nuevosProductos);
    }
    
    setForm({ nombre: '', precio: '', descripcion: '', imagen: '', talla: '' });
    setModalAbierto(false);
  };

  const handleEdit = (idx) => {
    setForm({ ...productos[idx] });
    setEditIndex(idx);
    setModalAbierto(true);
    setFileName('');
  };

  const handleDelete = (idx) => {
    setProductos(productos.filter((_, i) => i !== idx));
    if (editIndex === idx) setEditIndex(null);
  };

  const abrirModalAgregar = () => {
    setForm({ nombre: '', precio: '', descripcion: '', imagen: '', talla: '' });
    setEditIndex(null);
    setModalAbierto(true);
    setFileName('');
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setForm({ nombre: '', precio: '', descripcion: '', imagen: '', talla: '' });
    setEditIndex(null);
  };

  // Comprar producto (abre modal)
  const handleComprar = (idx) => {
    setModalCompra({ abierto: true, producto: productos[idx] });
    setCompra({ nombre: '', numero: '', vencimiento: '', cvv: '', direccion: '' });
    setErroresCompra({});
    setCompraExitosa(false);
  };

  const cerrarModalCompra = () => {
    setModalCompra({ abierto: false, producto: null });
    setCompra({ nombre: '', numero: '', vencimiento: '', cvv: '', direccion: '' });
    setErroresCompra({});
    setCompraExitosa(false);
  };

  const validarCompra = () => {
    const errs = {};
    if (!compra.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!/^\d{16}$/.test(compra.numero)) errs.numero = 'El número debe tener 16 dígitos';
    if (!/^\d{2}\/\d{2}$/.test(compra.vencimiento)) errs.vencimiento = 'Formato MM/AA';
    if (!/^\d{3}$/.test(compra.cvv)) errs.cvv = 'CVV de 3 dígitos';
    if (!compra.direccion.trim()) errs.direccion = 'La dirección es obligatoria';
    return errs;
  };

  const handleCompraChange = (e) => {
    setCompra({ ...compra, [e.target.name]: e.target.value });
  };

  const handleSubmitCompra = (e) => {
    e.preventDefault();
    const errs = validarCompra();
    setErroresCompra(errs);
    if (Object.keys(errs).length === 0) {
      setCompraExitosa(true);
      setTimeout(() => {
        cerrarModalCompra();
      }, 2000);
    }
  };

  const toggleFavorito = (id) => {
    if (!usuario) return;
    if (favoritos.includes(id)) {
      setFavoritos(favoritos.filter(fav => fav !== id));
    } else {
      setFavoritos([...favoritos, id]);
    }
  };

  // --- Búsqueda ---
  const handleBusquedaChange = (e) => {
    setTerminoBusqueda(e.target.value);
  };

  // --- Manejo de localStorage ---
  const comprimirImagen = (base64String, maxWidth = 300, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen comprimida
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con calidad reducida
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = base64String;
    });
  };

  const guardarProductosSeguro = (productosAGuardar) => {
    try {
      localStorage.setItem('miropa_productos_global', JSON.stringify(productosAGuardar));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Intentar limpiar datos antiguos
        try {
          localStorage.removeItem('miropa_productos_global');
          localStorage.setItem('miropa_productos_global', JSON.stringify(productosAGuardar));
          return true;
        } catch (cleanError) {
          window.alert('Error: No se puede guardar más productos. El almacenamiento está lleno.');
          return false;
        }
      }
      window.alert('Error al guardar productos: ' + error.message);
      return false;
    }
  };

  const LIMITE_PRODUCTOS = 50; // Límite máximo de productos

  const limpiarAlmacenamiento = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos los productos? Esta acción no se puede deshacer.')) {
      setProductos([]);
      localStorage.removeItem('miropa_productos_global');
      window.alert('Almacenamiento limpiado correctamente.');
    }
  };

  const obtenerInfoAlmacenamiento = () => {
    try {
      const productosGuardados = localStorage.getItem('miropa_productos_global');
      const tamano = productosGuardados ? new Blob([productosGuardados]).size : 0;
      const tamanoMB = (tamano / (1024 * 1024)).toFixed(2);
      return {
        productos: productos.length,
        tamano: tamanoMB,
        limite: LIMITE_PRODUCTOS
      };
    } catch (error) {
      return { productos: 0, tamano: '0', limite: LIMITE_PRODUCTOS };
    }
  };

  // --- Organizar productos en filas escalonadas ---
  const organizarProductosEnFilas = (productos) => {
    const filas = [];
    const productosPorFila = 4; // Número de productos por fila
    
    for (let i = 0; i < productos.length; i += productosPorFila) {
      filas.push(productos.slice(i, i + productosPorFila));
    }
    
    return filas;
  };

  // --- Renderizado ---
  const productosFiltrados = productos.filter(prod => {
    // Primero filtrar por pestaña
    let cumplePestana = true;
    if (pestana === 'tus') {
      cumplePestana = prod.creador === usuario?.nombre;
    } else if (pestana === 'otros') {
      cumplePestana = prod.creador !== usuario?.nombre;
    }
    // Luego filtrar por término de búsqueda si hay uno
    if (terminoBusqueda.trim()) {
      const busqueda = terminoBusqueda.toLowerCase().trim();
      const nombre = prod.nombre.toLowerCase();
      const descripcion = prod.descripcion.toLowerCase();
      const talla = prod.talla.toLowerCase();
      const creador = prod.creador.toLowerCase();
      return cumplePestana && (
        nombre.includes(busqueda) ||
        descripcion.includes(busqueda) ||
        talla.includes(busqueda) ||
        creador.includes(busqueda)
      );
    }
    return cumplePestana;
  });

  return (
    <>
      {/* Header global MIROPA */}
      <div className="miropa-marquee-container">
        <div className="miropa-marquee">
          {Array.from({length: 30}).map((_, i) => (
            <span className="miropa-marquee-title" key={i}>MIROPA</span>
          ))}
        </div>
      </div>
      {/* Fin header global */}
      <div style={{ paddingTop: '3.5rem' }}>
        { !usuario ? (
          <div className="registro-fondo" style={{background: '#f8b62d'}}>
            <div className="container d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 3.5rem)'}}>
              <div className="row w-100 justify-content-center align-items-center flex-row" style={{maxWidth: 1100}}>
                <div className="col-12 col-md-5 d-flex justify-content-center order-1 order-md-1 mb-4 mb-md-0" style={{alignItems: 'flex-start', marginTop: '0px', marginBottom: '60px'}}>
                  <div className="card text-center shadow-lg p-5 auth-card card-clickable d-flex align-items-center justify-content-center" style={{minWidth: 320, minHeight: 220, border: 'none', borderRadius: '0', cursor: 'pointer'}} onClick={() => setModalAuth('registro')}>
                    <div className="card-body d-flex flex-column align-items-center justify-content-center w-100 h-100">
                      <h3 className="card-title mb-0" style={{color:'#eafaff', fontWeight:700, fontSize:'2rem', width:'100%', textAlign:'center'}}>Crear cuenta</h3>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-5 d-flex justify-content-center order-2 order-md-2" style={{alignItems: 'flex-end', marginTop: '60px', marginBottom: '0px'}}>
                  <div className="card text-center shadow-lg p-5 auth-card card-clickable d-flex align-items-center justify-content-center" style={{minWidth: 320, minHeight: 220, border: 'none', borderRadius: '0', cursor: 'pointer'}} onClick={() => setModalAuth('login')}>
                    <div className="card-body d-flex flex-column align-items-center justify-content-center w-100 h-100">
                      <h3 className="card-title mb-0" style={{color:'#eafaff', fontWeight:700, fontSize:'2rem', width:'100%', textAlign:'center'}}>Iniciar sesión</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="miropa-container">
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '18px 36px 0 0'}}>
              <div 
                className="user-button"
                style={{
                  background: '#d80404',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, background-color 0.2s ease',
                  ':hover': {
                    transform: 'translateY(-1px)',
                    background: '#b80303'
                  }
                }} onClick={(e) => {
                  e.stopPropagation();
                  setMostrarLogout(!mostrarLogout);
                }} onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.background = '#b80303';
                }} onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = '#d80404';
                }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span style={{fontWeight: '600', fontSize: '1rem'}}><b>{usuario?.nombre}</b></span>
              </div>
              {mostrarLogout && (
                <div className={`logout-slide-container ${slideOut ? 'slide-out' : 'slide-in'}`}>
                  <button 
                    className="logout-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    style={{
                      background: '#d80404',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                      transform: 'translateY(0)',
                      width: '100%',
                      marginBottom: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#b80303';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#d80404';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    CERRAR SESIÓN
                  </button>
                </div>
              )}
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <div className="busqueda-container-header">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={terminoBusqueda}
                    onChange={handleBusquedaChange}
                    className="busqueda-input-header"
                  />
                </div>
                <button className="favoritos-btn" onClick={() => setMostrarFavoritos(!mostrarFavoritos)}>
                  <span style={{marginRight: 6}}>FAVORITOS</span>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={mostrarFavoritos ? '#55b2b6' : 'none'} stroke="#55b2b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>
            </div>
            <h1 className="titulo">MIROPA</h1>
            {!mostrarFavoritos && (
              <>
                <div className="tabs-productos">
                  <button className={pestana === 'otros' ? 'tab-activo' : ''} onClick={() => { setPestana('otros'); setTerminoBusqueda(''); }}>PRODUCTOS</button>
                  <button className={pestana === 'tus' ? 'tab-activo' : ''} onClick={() => { setPestana('tus'); setTerminoBusqueda(''); }}>TUS PRODUCTOS</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
                  {pestana === 'tus' && <button className="agregar-producto-btn" onClick={abrirModalAgregar}>Agregar Producto</button>}
                </div>
              </>
            )}
            {modalAbierto && (
              <div className="modal-fondo" onClick={cerrarModal}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2 style={{ color: '#d80404', marginBottom: 18 }}>{editIndex !== null ? 'Editar Producto' : 'Agregar Producto'}</h2>
                  <form className="formulario" onSubmit={handleSubmit}>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre de la prenda"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="number"
                      name="precio"
                      placeholder="Precio (CLP)"
                      value={form.precio}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="talla"
                      placeholder="Talla (ej: S, M, L, 38, etc)"
                      value={form.talla}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="descripcion"
                      placeholder="Descripción"
                      value={form.descripcion}
                      onChange={handleChange}
                    />
                    <input
                      type="file"
                      id="imagen"
                      name="imagen"
                      accept="image/*"
                      onChange={handleChange}
                      required={editIndex === null}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="imagen" className="custom-file-label">Seleccionar imagen</label>
                    <span className="file-name">{fileName}</span>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button type="submit">{editIndex !== null ? 'Actualizar' : 'Agregar'}</button>
                      <button type="button" className="cancelar" onClick={cerrarModal}>Cancelar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {modalCompra.abierto && (
              <div className="modal-fondo" onClick={cerrarModalCompra}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 400}}>
                  <h2 style={{ color: '#d80404', marginBottom: 18 }}>Comprar producto</h2>
                  <div style={{marginBottom: 12}}>
                    <b>{modalCompra.producto.nombre}</b><br/>
                    <span>Precio: {Number(modalCompra.producto.precio).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 })}</span><br/>
                    <span>Vendedor: {modalCompra.producto.creador}</span>
                  </div>
                  {compraExitosa ? (
                    <div style={{color:'#d80404', textAlign:'center', fontWeight:600, fontSize:'1.1rem'}}>¡Compra realizada con éxito!</div>
                  ) : (
                    <form className="formulario" onSubmit={handleSubmitCompra}>
                      <input
                        type="text"
                        name="nombre"
                        placeholder="Nombre en la tarjeta"
                        value={compra.nombre}
                        onChange={handleCompraChange}
                        required
                      />
                      {erroresCompra.nombre && <span className="error">{erroresCompra.nombre}</span>}
                      <input
                        type="text"
                        name="numero"
                        placeholder="Número de tarjeta (16 dígitos)"
                        value={compra.numero}
                        onChange={handleCompraChange}
                        maxLength={16}
                        required
                      />
                      {erroresCompra.numero && <span className="error">{erroresCompra.numero}</span>}
                      <input
                        type="text"
                        name="vencimiento"
                        placeholder="Vencimiento (MM/AA)"
                        value={compra.vencimiento}
                        onChange={handleCompraChange}
                        maxLength={5}
                        required
                      />
                      {erroresCompra.vencimiento && <span className="error">{erroresCompra.vencimiento}</span>}
                      <input
                        type="text"
                        name="cvv"
                        placeholder="CVV (3 dígitos)"
                        value={compra.cvv}
                        onChange={handleCompraChange}
                        maxLength={3}
                        required
                      />
                      {erroresCompra.cvv && <span className="error">{erroresCompra.cvv}</span>}
                      <input
                        type="text"
                        name="direccion"
                        placeholder="Dirección de entrega"
                        value={compra.direccion}
                        onChange={handleCompraChange}
                        required
                      />
                      {erroresCompra.direccion && <span className="error">{erroresCompra.direccion}</span>}
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button type="submit">Pagar</button>
                        <button type="button" className="cancelar" onClick={cerrarModalCompra}>Cancelar</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
            {mostrarFavoritos ? (
              <>
                <div className="tabs-productos" style={{marginTop: 10}}>
                  <button onClick={() => { setMostrarFavoritos(false); setPestana('otros'); setTerminoBusqueda(''); }}>
                    PRODUCTOS
                  </button>
                  <button onClick={() => { setMostrarFavoritos(false); setPestana('tus'); setTerminoBusqueda(''); }}>
                    TUS PRODUCTOS
                  </button>
                </div>
                <div className="galeria">
                  {favoritos.length === 0 ? (
                    <p className="sin-productos">No tienes productos favoritos.</p>
                  ) : (
                    organizarProductosEnFilas(productos.filter((prod, idx) => favoritos.includes(idx))).map((fila, filaIdx) => (
                      <div className="fila-productos" key={filaIdx}>
                        {fila.map((prod, idx) => {
                          const productoIndex = productos.indexOf(prod);
                          return (
                            <div className="producto" key={`favorito-${filaIdx}-${idx}`}>
                              <img src={prod.imagen} alt={prod.nombre} className="imagen-producto" />
                              <h2>{prod.nombre}</h2>
                              <p className="precio">{Number(prod.precio).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 })}</p>
                              <p className="talla">Talla: {prod.talla}</p>
                              <p className="descripcion">{prod.descripcion}</p>
                              <p style={{fontSize:'0.95rem', color:'var(--negro)', marginBottom:8}}>Vendedor: {prod.creador}</p>
                              <div className="acciones">
                                <button className="eliminar" onClick={() => toggleFavorito(productoIndex)}>QUITAR DE FAVORITOS</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              productosFiltrados.length === 0 ? (
                <p className="sin-productos">
                  {terminoBusqueda.trim() 
                    ? `No se encontraron productos que coincidan con "${terminoBusqueda}"`
                    : 'No hay productos para mostrar.'
                  }
                </p>
              ) : (
                organizarProductosEnFilas(productosFiltrados).map((fila, filaIdx) => (
                  <div className="fila-productos" key={filaIdx}>
                    {fila.map((prod, idx) => {
                      const productoIndex = productos.indexOf(prod);
                      return (
                        <div className="producto" key={`${filaIdx}-${idx}`}>
                          <img src={prod.imagen} alt={prod.nombre} className="imagen-producto" />
                          <h2>{prod.nombre}</h2>
                          <p className="precio">{Number(prod.precio).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 })}</p>
                          <p className="talla">Talla: {prod.talla}</p>
                          <p className="descripcion">{prod.descripcion}</p>
                          <p style={{fontSize:'0.95rem', color:'var(--negro)', marginBottom:8}}>Vendedor: {prod.creador}</p>
                          <div className="acciones">
                            {prod.creador !== usuario.nombre && pestana === 'otros' && (
                              <button type="button" className="bookmark-btn" onClick={() => toggleFavorito(productoIndex)} title={favoritos.includes(productoIndex) ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill={favoritos.includes(productoIndex) ? '#55b2b6' : 'none'} stroke="#55b2b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                              </button>
                            )}
                            {prod.creador === usuario.nombre ? (
                              <>
                                <button onClick={() => handleEdit(productoIndex)}>Editar</button>
                                <button className="eliminar" onClick={() => handleDelete(productoIndex)}>Eliminar</button>
                              </>
                            ) : (
                              <button onClick={() => handleComprar(productoIndex)} style={{background:'#d80404', color:'#fff'}}>COMPRAR</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
      
      {/* Footer con información de contacto */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MIROPA</h3>
            <p>Tu tienda de ropa online favorita</p>
            <p>Compra y vende prendas de manera segura</p>
          </div>
          
          <div className="footer-section">
            <h4>Contacto</h4>
            <p>📧 info@miropa.cl</p>
            <p>📞 +56 9 1234 5678</p>
            <p>📱 +56 9 8765 4321</p>
          </div>
          
          <div className="footer-section">
            <h4>Redes Sociales</h4>
            <p>📘 Facebook: @miropa.cl</p>
            <p>📷 Instagram: @miropa.cl</p>
            <p>🐦 Twitter: @miropa_cl</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 MIROPA. Todos los derechos reservados.</p>
        </div>
      </footer>
      {/* Modal de login/registro fuera del layout principal */}
      {modalAuth && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(10,10,20,0.85)'}} onClick={() => setModalAuth(null)}>
          <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{borderRadius: '18px', boxShadow: '0 6px 32px rgba(85, 178, 182, 0.18)'}}>
              <div className="modal-header border-0" style={{background:'#1e3a4c', borderTopLeftRadius:'18px', borderTopRightRadius:'18px'}}>
                <h5 className="modal-title w-100 text-center" style={{color:'#eafaff', fontWeight:700, fontSize:'1.5rem'}}>
                  {modalAuth === 'registro' ? 'Crear cuenta en MiRopa' : 'Iniciar sesión en MiRopa'}
                </h5>
                <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setModalAuth(null)} style={{filter:'invert(1)'}}></button>
              </div>
              <div className="modal-body p-4">
                {modalAuth === 'registro' ? (
                  <form className="formulario" onSubmit={handleRegistro}>
                    <div className="mb-3 w-100">
                      <input
                        type="text"
                        name="nombre"
                        className="form-control"
                        placeholder="Nombre de usuario"
                        value={registro.nombre}
                        onChange={handleRegistroChange}
                        required
                      />
                      {errores.nombre && <div className="text-danger small mt-1">{errores.nombre}</div>}
                    </div>
                    <div className="mb-3 w-100">
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Contraseña"
                        value={registro.password}
                        onChange={handleRegistroChange}
                        required
                      />
                      {errores.password && <div className="text-danger small mt-1">{errores.password}</div>}
                    </div>
                    <div className="mb-3 w-100">
                      <input
                        type="password"
                        name="confirmar"
                        className="form-control"
                        placeholder="Confirmar contraseña"
                        value={registro.confirmar}
                        onChange={handleRegistroChange}
                        required
                      />
                      {errores.confirmar && <div className="text-danger small mt-1">{errores.confirmar}</div>}
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-3">
                      <button type="submit" className="btn btn-primary" style={{background:'#55b2b6', border:'none'}}>Crear cuenta</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setModalAuth(null)}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <form className="formulario" onSubmit={handleLogin}>
                    <div className="mb-3 w-100">
                      <input
                        type="text"
                        name="nombre"
                        className="form-control"
                        placeholder="Nombre de usuario"
                        value={login.nombre}
                        onChange={handleLoginChange}
                        required
                      />
                      {errores.nombre && <div className="text-danger small mt-1">{errores.nombre}</div>}
                    </div>
                    <div className="mb-3 w-100">
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Contraseña"
                        value={login.password}
                        onChange={handleLoginChange}
                        required
                      />
                      {errores.password && <div className="text-danger small mt-1">{errores.password}</div>}
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-3">
                      <button type="submit" className="btn btn-primary" style={{background:'#55b2b6', border:'none'}}>Iniciar sesión</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setModalAuth(null)}>Cancelar</button>
                    </div>
                  </form>
                )}
              </div>
              <div className="modal-footer border-0 d-flex flex-column align-items-center" style={{background:'#eafaff', borderBottomLeftRadius:'18px', borderBottomRightRadius:'18px'}}>
                {modalAuth === 'registro' ? (
                  <div className="auth-switch mt-2 text-center">
                    ¿Ya tienes cuenta? <button type="button" className="btn btn-link p-0" onClick={() => setModalAuth('login')}>Iniciar sesión</button>
                  </div>
                ) : (
                  <div className="auth-switch mt-2 text-center">
                    ¿No tienes cuenta? <button type="button" className="btn btn-link p-0" onClick={() => setModalAuth('registro')}>Crear cuenta</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
