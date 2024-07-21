import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

const splitQuery = (query) => {
  const selectIndex = query.toLowerCase().indexOf('select');
  const fromIndex = query.toLowerCase().indexOf('from');
  const joinIndex = query.toLowerCase().indexOf('join');
  const whereIndex = query.toLowerCase().indexOf('where');
  const groupByIndex = query.toLowerCase().indexOf('group by');
  const andIndex = query.toLowerCase().indexOf('and');
  const orIndex = query.toLowerCase().indexOf('or');
  const binByIndex = query.toLowerCase().indexOf('bin by');
  const orderByIndex = query.toLowerCase().indexOf('order by');
  const visualizeIndex = query.toLowerCase().indexOf('visualize');

  let selectClause = '';
  let fromClause = '';
  let joinClause = '';
  let whereClause = '';
  let groupByClause = '';
  let andClause = '';
  let binByClause = '';
  let orClause = '';
  let orderByClause = '';
  let visualizeClause = '';

  if (fromIndex !== -1) {
    fromClause = query.substring(fromIndex, joinIndex !== -1 ? joinIndex : (whereIndex !== -1 ? whereIndex : query.length)).trim();
  }

  if (selectIndex !== -1 && fromIndex !== -1) {
    selectClause = query.substring(selectIndex, fromIndex).trim();
  }

  if (joinIndex !== -1) {
    joinClause = query.substring(joinIndex, whereIndex !== -1 ? whereIndex : query.length).trim();
  }

  if (whereIndex !== -1) {
    whereClause = query.substring(whereIndex, andIndex !== -1 ? andIndex : (orIndex !== -1 ? orIndex : query.length)).trim();
  }

  if (andIndex !== -1) {
    andClause = query.substring(andIndex, orIndex !== -1 ? orIndex : query.length).trim();
  }

  if (orIndex !== -1) {
    orClause = query.substring(orIndex, groupByIndex !== -1 ? groupByIndex : query.length).trim();
  }

  if (groupByIndex !== -1) {
    groupByClause = query.substring(groupByIndex, orderByIndex !== -1 ? orderByIndex : query.length).trim();
  }

  if (orderByIndex !== -1) {
    orderByClause = query.substring(orderByIndex, binByIndex !== -1 ? binByIndex : query.length).trim();
  }

  if (binByIndex !== -1) {
    binByClause = query.substring(binByIndex, query.length).trim();
  }

  if (visualizeIndex !== -1 && selectIndex !== -1) {
    visualizeClause = query.substring(visualizeIndex, selectIndex).trim();
  }

  return { visualizeClause, selectClause, fromClause, joinClause, whereClause, groupByClause, andClause, orClause,binByClause,orderByClause };
};

const VisualizationBreakdown = ({ query, setVisualizationQuery, onExecute }) => {
  const [clauses, setClauses] = useState(splitQuery(query));

  useEffect(() => {
    setClauses(splitQuery(query));
  }, [query]);

  const handleInputChange = (e, clauseType) => {
    const newClauses = { ...clauses, [clauseType]: e.target.value };
    setClauses(newClauses);
    const newQuery = `${newClauses.visualizeClause} ${newClauses.selectClause} ${newClauses.fromClause} ${newClauses.joinClause} ${newClauses.whereClause} ${newClauses.groupByClause} ${newClauses.andClause} ${newClauses.orClause}${newClauses.orderByClause}`.trim();
    setVisualizationQuery(newQuery);
  };

  return (
    <div>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>From statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.fromClause}
              onChange={e => handleInputChange(e, 'fromClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.fromClause, 'from')}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Join statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.joinClause}
              onChange={e => handleInputChange(e, 'joinClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.joinClause, 'join', '', clauses.selectClause, clauses.fromClause, clauses.joinClause)}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Where statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.whereClause}
              onChange={e => handleInputChange(e, 'whereClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.whereClause, 'where','', clauses.selectClause, clauses.fromClause, clauses.joinClause)}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>And statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.andClause}
              onChange={e => handleInputChange(e, 'andClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.andClause, 'and', '',clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause,'', clauses.orClause)}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Or statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.orClause}
              onChange={e => handleInputChange(e, 'orClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.orClause, 'or', '',clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause, clauses.andClause)}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Select statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.selectClause}
              onChange={e => handleInputChange(e, 'selectClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.selectClause, 'select', '', clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause)}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Group By statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.groupByClause}
              onChange={e => handleInputChange(e, 'groupByClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.groupByClause, 'group by', '', clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause, clauses.andClause,clauses.orClause)}>Run</Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Order By statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.orderByClause}
              onChange={e => handleInputChange(e, 'orderByClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.orderByClause, 'order by', '', clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause, clauses.andClause,'',clauses.groupByClause,'',clauses.binByClause)}>Run</Button>
        </Col>
        </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Bin By statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.binByClause}
              onChange={e => handleInputChange(e, 'binByClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.binByClause, 'bin by', '', clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause, clauses.andClause,clauses.orClause,clauses.groupByClause,clauses.orderByClause)}>Run</Button>
        </Col>
        </Row>   
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Visualization statement</Form.Label>
            <Form.Control
              type="text"
              value={clauses.visualizeClause}
              onChange={e => handleInputChange(e, 'visualizeClause')}
            />
          </Form.Group>
        </Col>
        <Col xs="auto" className="align-self-end">
          <Button variant="secondary" onClick={() => onExecute(clauses.visualizeClause, 'visualize', clauses.visualizeClause, clauses.selectClause, clauses.fromClause, clauses.joinClause, clauses.whereClause, clauses.andClause,clauses.orClause,clauses.groupByClause,clauses.orderByClause,clauses.binByClause)}>Run</Button>
        </Col>
      </Row>
    </div>
  );
};

export default VisualizationBreakdown;

 