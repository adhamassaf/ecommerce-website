const AdminField = ({ label, hint, as: Control = 'input', children, ...otherProps }) => (
  <label className='admin-field'>
    <span className='admin-field-label'>{label}</span>
    <Control className='admin-field-control' {...otherProps}>
      {children}
    </Control>
    {hint && <span className='admin-hint'>{hint}</span>}
  </label>
);

export default AdminField;
