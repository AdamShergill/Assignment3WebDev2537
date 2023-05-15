const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let numPages = 0;

const filterPokemonsByType = async () => {
  const selectedTypes = $('.typeFilter:checked').map(function () {
    return this.value;
  }).get();

  if (selectedTypes.length === 0) {
    paginate(currentPage, PAGE_SIZE, pokemons);
    updatePaginationDiv(currentPage, numPages);
    return;
  }

  const responses = await Promise.all(pokemons.map(pokemon => axios.get(pokemon.url)));

  const filteredPokemons = pokemons.filter((pokemon, index) => {
    const types = responses[index].data.types.map(type => type.type.name);
    return selectedTypes.every(type => types.includes(type));
  });

  currentPage = 1;
  pokemons = filteredPokemons;
  paginate(currentPage, PAGE_SIZE, filteredPokemons);
  numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
};

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, numPages);

  if (currentPage > 1) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons" value="${currentPage - 1}">Prev</button>
    `);
  }

  for (let i = startPage; i <= endPage; i++) {
    const buttonClass = (i === currentPage) ? 'btn-primary active' : 'btn-primary';
    $('#pagination').append(`
      <button class="btn page ml-1 numberedButtons ${buttonClass}" value="${i}">${i}</button>
    `);
  }

  if (currentPage < numPages) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons" value="${currentPage + 1}">Next</button>
    `);
  }
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  const selectedPokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  $('#pokeCards').empty();
  for (const pokemon of selectedPokemons) {
    try {
      const res = await axios.get(pokemon.url);
      $('#pokeCards').append(`
        <div class="pokeCard card" pokeName="${res.data.name}">
          <h3>${res.data.name.toUpperCase()}</h3> 
          <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
          <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
            More
          </button>
        </div>  
      `);
    } catch (error) {
      console.error('Error fetching Pokémon details:', error);
    }
  }
};

const setup = async () => {
  $('#pokeCards').empty();
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons);
  numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);

  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName');
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const types = res.data.types.map((type) => type.type.name);

    $('.modal-body').html(`
      <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
          <h3>Abilities</h3>
          <ul>
            ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
          </ul>
        </div>

        <div>
          <h3>Stats</h3>
          <ul>
            ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
          </ul>
        </div>
      </div>
      <h3>Types</h3>
      <ul>
        ${types.map((type) => `<li>${type}</li>`).join('')}
      </ul>
    `);

    $('.modal-title').html(`
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `);
  });

  $('body').on('click', '.numberedButtons', async function (e) {
    currentPage = Number(e.target.value);

    if ($('.typeFilter:checked').length === 0) {
      paginate(currentPage, PAGE_SIZE, pokemons);
      updatePaginationDiv(currentPage, numPages);
    } else {
      filterPokemonsByType();
    }
  });

  $('.typeFilter').change(function () {
    if ($(this).is(':checked')) {
      filterPokemonsByType();
    } else {
      if ($('.typeFilter:checked').length === 0) {
        paginate(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, numPages);
      } else {
        filterPokemonsByType();
      }
    }
  });
};

$(document).ready(setup);