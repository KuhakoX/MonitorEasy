import styles from '../frontend/styles/Header.module.css';

function Header() {
    return (
        <header className={styles.header}>
            <h1><span style={{ color: 'green' }}>Monitor</span><span style={{ color: 'black' }}>Easy</span></h1>
            <button className={styles.button}>Login</button>
        </header>
    )
}

export default Header;