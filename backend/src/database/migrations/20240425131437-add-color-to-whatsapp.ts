import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Whatsapps", "color", {
      type: DataTypes.STRING,
      allowNull: true, // O false si necesitas que el campo sea obligatorio
      defaultValue: "#2576D2" // Estableciendo el valor por defecto para 'color'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("Whatsapps", "color");
  }
};
