function Error({ statusCode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;