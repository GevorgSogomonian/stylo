import React, { useState } from 'react';

const SearchBar = ({ data, onSearch }) => {
    const [query, setQuery] = useState('');

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Фильтруем данные на основе запроса
        const filteredData = data.filter(item =>
            item.toLowerCase().includes(value.toLowerCase())
        );

        // Вызываем callback с отфильтрованными данными
        onSearch(filteredData);
    };

    return (
        <div style={styles.container}>
            <input
                type="text"
                placeholder="Поиск..."
                value={query}
                onChange={handleInputChange}
                style={styles.input}
            />
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        maxWidth: '400px',
        margin: '20px auto',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        color:'white',
    },
};

export default SearchBar;