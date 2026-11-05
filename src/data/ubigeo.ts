export interface UbigeoDistrito {
  nombre: string;
}

export interface UbigeoProvincia {
  nombre: string;
  distritos: string[];
}

export interface UbigeoDepartamento {
  nombre: string;
  provincias: Record<string, string[]>;
}

export const UBIGEO_PERU: Record<string, Record<string, string[]>> = {
  Lima: {
    Lima: [
      'San Juan de Lurigancho',
      'Santiago de Surco',
      'Miraflores',
      'San Borja',
      'Los Olivos',
      'Ate',
      'Chorrillos',
      'San Martín de Porres',
      'Comas',
      'Villa El Salvador',
      'San Miguel',
      'Jesús María',
      'Magdalena del Mar',
      'Pueblo Libre',
      'Lince',
      'La Molina',
      'San Isidro',
      'Breña',
      'Rímac',
      'Independencia',
      'El Agustino',
      'Santa Anita',
      'Puente Piedra',
      'Carabayllo',
      'Villa María del Triunfo',
      'Barranco',
      'Surquillo',
      'Lurigancho-Chosica',
      'Pachacámac',
      'Lurín'
    ],
    Huaral: ['Huaral', 'Chancay', 'Aucallama'],
    Cañete: ['San Vicente de Cañete', 'Imperial', 'Mala', 'Asia', 'Chilca'],
    Huaura: ['Huacho', 'Hualmay', 'Santa María', 'Sayán'],
    Barranca: ['Barranca', 'Paramonga', 'Pativilca', 'Supe']
  },
  Callao: {
    Callao: [
      'Callao Cercado',
      'Bellavista',
      'La Perla',
      'La Punta',
      'Carmen de la Legua',
      'Ventanilla',
      'Mi Perú'
    ]
  },
  Arequipa: {
    Arequipa: [
      'Arequipa Cercado',
      'Cerro Colorado',
      'Paucarpata',
      'José Luis Bustamante y Rivero',
      'Cayma',
      'Yanahuara',
      'Socabaya',
      'Mariano Melgar',
      'Miraflores',
      'Alto Selva Alegre'
    ],
    Islay: ['Mollendo', 'Cocachacra', 'Mejía']
  },
  'La Libertad': {
    Trujillo: [
      'Trujillo Cercado',
      'Víctor Larco Herrera',
      'Huanchaco',
      'La Esperanza',
      'El Porvenir',
      'Florencia de Mora',
      'Moche',
      'Laredo'
    ]
  },
  Lambayeque: {
    Chiclayo: [
      'Chiclayo Cercado',
      'José Leonardo Ortiz',
      'La Victoria',
      'Pimentel',
      'Reque',
      'Monsefú'
    ],
    Lambayeque: ['Lambayeque', 'Mórrope', 'Olmos']
  },
  Piura: {
    Piura: ['Piura Cercado', 'Castilla', 'Veintiséis de Octubre', 'Catacaos'],
    Sullana: ['Sullana', 'Bellavista', 'Marcavelica'],
    Talara: ['Pariñas', 'Máncora', 'Los Órganos']
  },
  Ancash: {
    Santa: ['Chimbote', 'Nuevo Chimbote', 'Coishco', 'Santa'],
    Huaraz: ['Huaraz', 'Independencia']
  },
  Ica: {
    Ica: ['Ica Cercado', 'La Tinguiña', 'Parcona', 'Subtanjalla'],
    Chincha: ['Chincha Alta', 'Pueblo Nuevo', 'Sunampe', 'Grocio Prado'],
    Pisco: ['Pisco Cercado', 'San Andrés', 'Paracas']
  },
  Junín: {
    Huancayo: ['Huancayo Cercado', 'El Tambo', 'Chilca', 'Pilcomayo']
  },
  Cusco: {
    Cusco: ['Cusco Cercado', 'Wanchaq', 'San Sebastián', 'Santiago', 'San Jerónimo']
  }
};
