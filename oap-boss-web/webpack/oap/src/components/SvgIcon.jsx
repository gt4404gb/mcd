import React from 'react';
import "@/style/svgIcon.less";
// import is_new from '@/assets/svg/is_new.svg';
class SvgIcon extends React.Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  componentDidMount() {}


  render() {
    const {icon, className} = this.props;
    // const iconUrl = require(`@/assets/svg/${icon}.svg`);
    const styleExternalIcon = {
      mask: `url(${icon}) no-repeat 50% 50%`,
      WebkitMask: `url(${icon}) no-repeat 50% 50%`
    };

    const isExternal = (path) => /^(https?:|mailto:|tel:)/.test(path);
    return (
      <>
        {isExternal(icon) ?
          <div style={styleExternalIcon} className={`svg-external-icon svg-icon ${className}`}/> :
          <svg className={`svg-icon ${className}`} aria-hidden="true">
            <use xlinkHref={`#icon-${icon}`}/>
          </svg>
          // <img className={`svg-icon ${className}`} src={iconUrl} />
        }
      </>
    );
  }
}

export default SvgIcon;