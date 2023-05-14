import React from 'react';
import { Spin, Divider, Form, Row, Col, DatePicker, Button, Select, Modal, message, Input, Space } from '@aurum/pfe-ui';
import { saveSchedule, checksql, getScheduleDetail, updateSchedule } from '@/api/oap/schedule.js';
import moment from 'moment';
import { optionFilterProp } from "@/utils/store/func";
import { TASK_TYPE_LIST, PERIOD_TYPE_LIST, PERIOD_WEEK_LIST, PERIOD_MONTH_LIST, PERIOD_DATE_LIST, SQL_LIMITS_LIST } from '@/constants';
import { decode, encode } from 'js-base64';

export default class Editform extends React.Component {
    constructor(props) {
        super(props);
        this.formScheduleRef = React.createRef();
        this.state = {
            isLoading: false,
            formInfo: {},
            limits: 1000,
            validateStatus: '-',
            help: '',
            editId: null,
        }
    }

    async componentDidMount () {
        const { id } = this.props;
        if (id) {
            this.setState({
                editId: id
            });
            await this.initShow(id);
        } else {
            const formInfo = {
                ...this.props,
                taskTypeName: optionFilterProp(TASK_TYPE_LIST, 'value', this.props.taskType)?.label || '',
                sqlStr: this.props?.sqlStr ? decode(this.props.sqlStr) : '',
                expiryDate: moment().add(1, 'years')
            }
            this.formScheduleRef.current.setFieldsValue({ ...formInfo })
            this.setState({
                formInfo,
                limits: this.props?.limits
            })
        }
    }

    initShow = async (id) => {
        this.setState({ isLoading: true })
        try {
            const res = await getScheduleDetail({ id });
            const formInfo = {
                ...res.data,
                taskTypeName: optionFilterProp(TASK_TYPE_LIST, 'value', res.data.taskType)?.label || '',
                sqlStr: res.data?.sqlStr ? decode(res.data.sqlStr) : '',
                expiryDate: moment(res.data?.expiryDate),
                date: res.data?.refreshControl?.date,
                dayOfMonth: res.data?.refreshControl?.dayOfMonth,
                dayOfWeek: res.data?.refreshControl?.dayOfWeek,
                type: res.data?.refreshControl?.type,
            }
            this.formScheduleRef.current.setFieldsValue({ ...formInfo })
            this.setState({ formInfo, limits: res.data.limits, isLoading: false })
        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({ isLoading: false })
        }
    }

    handleChangeRate = (value, key) => {
        const { formInfo } = this.state;
        this.setState({
            formInfo: {
                ...formInfo,
                [key]: value
            }
        })
    }

    //校验sql
    checkSQL = async () => {
        let { limits } = this.state, validateStatus = '-';
        const formData = this.formScheduleRef.current.getFieldsValue();
        this.setState({ isLoading: true })
        try {
            const checkResult = await checksql({ sql: encode(formData.sqlStr), limits });
            this.setState({
                validateStatus: checkResult.msg,
                help: <span className='ant-form-item-feedback-icon-success' style={{ lineHeight: '30px', paddingLeft: '4px' }}>测试通过</span>,
                isLoading: false
            })
            validateStatus = checkResult.msg;
        } catch (errInfo) {
            this.setState({
                validateStatus: 'error',
                help: <div style={{ backgroundColor: '#dcdcdc', color: '#FF2525', lineHeight: '30px', paddingLeft: '4px' }}>{errInfo.msg}</div>,
                isLoading: false
            })
            validateStatus = 'error';
        }
        return validateStatus
    }

    handleSave = () => {
        const { formInfo, limits, validateStatus, editId } = this.state;
        this.formScheduleRef.current.validateFields().then(async (values) => {
            let commitParams = {
                ...formInfo,
                ...values,
                sqlStr: encode(formInfo.sqlStr),
                refreshControl: {
                    type: values.type,
                    date: values.date,
                    dayOfWeek: values?.dayOfWeek || '',
                    dayOfMonth: values?.dayOfMonth || '',
                },
                expiryDate: moment(values.expiryDate).format('x'),
                limits,
                isDeleted: 0,
            }, checkSqlResult = validateStatus, requestApi = saveSchedule;
            if (formInfo.taskType == TASK_TYPE_LIST[0].value) {
                if (['-'].includes(checkSqlResult)) {
                    checkSqlResult = await this.checkSQL();
                }
                if (checkSqlResult != 'success') {
                    message.error('sql 校验不通过，请核实');
                    return
                }
            }
            this.setState({ isLoading: true })
            if (editId) requestApi = updateSchedule;
            try {
                const res = await requestApi(commitParams);
                if (res.msg == 'success') {
                    message.success('保存成功', 2, () => {
                        this.props.onBack();
                        this.setState({ isLoading: false })
                    })
                }
            } catch (errInfo) {
                errInfo.msg && message.error(errInfo.msg);
                this.setState({ isLoading: false })
            }
        }).catch(err => {
            console.log('表单校验失败', err)
            if (formInfo.taskType == TASK_TYPE_LIST[0].value) {
                if ((err.values.sqlStr ?? '') == '') {
                    this.setState({
                        validateStatus: 'error',
                        help: <div style={{ backgroundColor: '#dcdcdc', color: '#FF2525', lineHeight: '30px', paddingLeft: '4px' }}>请输入SQL</div>,
                        isLoading: false
                    })
                }
            }
        })
    }

    handleCancel = () => {
        Modal.confirm({
            title: "离开此页面？",
            content: <span>离开将丢失已编辑内容，请确认是否离开？</span>,
            okText: "确定",
            cancelText: "取消",
            onOk: () => {
                this.props.onBack();
            }
        });
    }

    render () {
        const { isLoading, formInfo, limits, validateStatus, help } = this.state;
        const disabledDate = (current) => {
            return current && current < moment().subtract(1, 'days')
        }
        return <Spin spinning={isLoading}>
            <Form
                ref={this.formScheduleRef}
                labelCol={{ style: { width: '80px' } }}
                initialValues={formInfo}
                style={{ padding: '0 16px 16px' }}>
                <Row>
                    <Col span={12}>
                        <Divider orientation="left" style={{ borderColor: '#bbb' }}>基本信息</Divider>
                    </Col>
                </Row>
                <Row>
                    <Col flex="400px" style={{ height: '37px' }}>
                        <Form.Item label="任务类型：">
                            <span>{formInfo?.taskTypeName}</span>
                        </Form.Item>
                    </Col>
                </Row>
                {formInfo.taskType == TASK_TYPE_LIST[1].value && <Row>
                    <Col flex="400px" style={{ height: '37px' }}>
                        <Form.Item label="分析任务：">
                            <span>{formInfo?.businessCategoryName}-{formInfo?.sliceName}</span>
                        </Form.Item>
                    </Col>
                </Row>}
                <Row>
                    <Col flex="520px">
                        <Form.Item name="taskName" label="任务名称：" rules={[{ required: true, message: '请输入名称' }]}>
                            <Input placeholder="请输入名称" maxLength="30" allowClear showCount />
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col flex="680px">
                        <Form.Item name="instruction" label="说明：">
                            <Input.TextArea placeholder="请输入说明" rows={4} maxLength="500" showCount />
                        </Form.Item>
                    </Col>
                </Row>
                {formInfo.taskType == TASK_TYPE_LIST[0].value && <>
                    <Row>
                        <Col flex="900px">
                            <Form.Item
                                name="sqlStr"
                                label="SQL代码"
                                validateStatus={validateStatus}
                                help={help}
                                rules={[{ required: true, message: '请输入SQL' }]} >
                                <Input.TextArea placeholder="请输入SQL" rows={6} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col flex="400px" style={{ marginLeft: '90px', marginBottom: '10px' }}>
                            <span>LIMIT</span>
                            <Select
                                options={SQL_LIMITS_LIST}
                                value={limits}
                                onChange={(value) => this.setState({ limits: value })}
                                style={{ width: '100px', marginLeft: '10px' }}></Select>
                            <Button type="link" onClick={this.checkSQL}>测试代码</Button>
                        </Col>
                    </Row>
                </>}
                <Row>
                    <Col span={12}>
                        <Divider orientation="left" style={{ borderColor: '#bbb' }}>任务规则</Divider>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Item label={<span className="form-item-label"><i>*</i>任务频率</span>}>
                            <Form.Item name="type" noStyle rules={[{ required: true, message: '请选择任务频率类型' }]}>
                                <Select
                                    style={{ width: '120px', marginRight: '10px' }}
                                    onChange={(value) => this.handleChangeRate(value, 'type')}>
                                    {PERIOD_TYPE_LIST.map(period => (
                                        <Select.Option key={period.label} value={period.value}>{period.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {/*dayWeek*/}
                            {(formInfo.type == PERIOD_TYPE_LIST[1].value || formInfo.type === PERIOD_TYPE_LIST[2].value) && <Form.Item name="dayOfWeek" noStyle rules={[{ required: true, message: '请选择星期几' }]}>
                                <Select style={{ width: '120px', marginRight: '10px' }}>
                                    {PERIOD_WEEK_LIST.map(period => (
                                        <Select.Option key={period.label} value={period.value}>{period.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>}
                            {/*dayMonth*/}
                            {formInfo.type == PERIOD_TYPE_LIST[3].value && <Form.Item name="dayOfMonth" noStyle rules={[{ required: true, message: '请选择日期' }]}>
                                <Select style={{ width: '120px', marginRight: '10px' }}>
                                    {PERIOD_MONTH_LIST.map(period => (
                                        <Select.Option key={period.label} value={period.value}>{period.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>}
                            <Form.Item name="date" noStyle rules={[{ required: true, message: '请选择时间' }]}>
                                <Select style={{ width: '120px', marginRight: '10px' }}>
                                    {PERIOD_DATE_LIST.map(period => (
                                        <Select.Option key={period.label} value={period.value}>{period.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col flex="400px">
                        <Form.Item name="expiryDate" label="失效日期：" rules={[{ required: true, message: '请选择失效日期' }]}>
                            <DatePicker disabledDate={disabledDate} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <Space>
                            <Button type="primary" loading={isLoading} onClick={this.handleSave}>保存</Button>
                            <Button onClick={this.handleCancel}>取消</Button>
                        </Space>
                    </Col>
                </Row>
            </Form>
        </Spin>
    }
}