import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController {
  async index(request: Request, response: Response) {
    const {city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

      const points = await knex('points')
        .join('point_items', 'points.id', '=', 'point_items.point_id')
        .whereIn('point_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');

    return response.json(points);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ message: 'Point not found.'})
    }

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title');

    return response.json({point, items});
  }

  async create(request: Request, response: Response) {
    const { 
      name, 
      email, 
      whatsapp, 
      latitude, 
      longitude, 
      city, 
      uf, 
      items
    } = request.body;

    const trx = await knex.transaction();

    const point = {
      image: 'https://blog.guiabolso.com.br/wp-content/uploads/2018/02/mercado-1-1-700x525.jpg', 
      name, 
      email, 
      whatsapp, 
      latitude, 
      longitude, 
      city, 
      uf 
    }

    const insertedIds = await trx('points').insert(point);

    const point_id = insertedIds[0]

    const pointItens = items.map((item_id: number) => {
      return {
        item_id,
        point_id
      };
    })

    await trx('point_items').insert(pointItens);

    await trx.commit();

    return response.json({
      id: point_id,
      ...point,
    })
  }
}

export default PointsController;