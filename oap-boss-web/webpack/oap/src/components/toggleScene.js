import React from "react";
import { IconListA, IconCatalogueA } from "@aurum/icons";
export default class ToggleScene extends React.Component {
    constructor() {
        super();
    }

    toggleScene(type) {
        if (type === this.props.pageType) {
            return
        }
        this.props.pageChange && this.props.pageChange(type);
    }

    render() {
        const {pageType} = this.props;
        return (
            <div className="oap-scene-affix">
                <span className={pageType == 'card' ? 'active' : ''} style={{borderRight: '0',borderTopLeftRadius:'4px',borderBottomLeftRadius:'4px'}}
                      onClick={() => this.toggleScene('card')}><IconCatalogueA /></span>
                <span className={pageType == 'list' ? 'active' : ''} style={{borderLeft: '0',borderTopRightRadius:'4px',borderBottomRightRadius:'4px'}}
                      onClick={() => this.toggleScene('list')}><IconListA
                    /></span>
            </div>
        )
    }
}