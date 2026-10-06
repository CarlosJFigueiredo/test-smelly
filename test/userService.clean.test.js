const { UserService } = require('../src/userService');

const MSG_MENOR_DE_IDADE = 'O usuário deve ser maior de idade.';
const MSG_CAMPOS_OBRIGATORIOS = 'Nome, email e idade são obrigatórios.';

function umUsuario(overrides = {}) {
  return {
    nome: 'Fulano de Tal',
    email: 'fulano@teste.com',
    idade: 25,
    isAdmin: false,
    ...overrides,
  };
}

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  const criar = (dados) =>
    userService.createUser(dados.nome, dados.email, dados.idade, dados.isAdmin);

  describe('createUser', () => {
    test('deve criar usuário com id, dados informados e status ativo', () => {
      // Arrange
      const dados = umUsuario();

      // Act
      const usuario = criar(dados);

      // Assert
      expect(usuario).toMatchObject({
        nome: dados.nome,
        email: dados.email,
        idade: dados.idade,
        isAdmin: false,
        status: 'ativo',
      });
      expect(usuario.id).toEqual(expect.any(String));
    });

    test('deve lançar erro ao criar usuário menor de idade', () => {
      // Arrange
      const dados = umUsuario({ idade: 17 });

      // Act
      const criarMenor = () => criar(dados);

      // Assert
      expect(criarMenor).toThrow(MSG_MENOR_DE_IDADE);
    });

    test('deve lançar erro ao criar usuário sem nome', () => {
      // Arrange
      const dados = umUsuario({ nome: '' });

      // Act
      const criarSemNome = () => criar(dados);

      // Assert
      expect(criarSemNome).toThrow(MSG_CAMPOS_OBRIGATORIOS);
    });
  });

  describe('getUserById', () => {
    test('deve retornar o usuário previamente criado', () => {
      // Arrange
      const criado = criar(umUsuario());

      // Act
      const buscado = userService.getUserById(criado.id);

      // Assert
      expect(buscado).toEqual(criado);
    });

    test('deve retornar null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const buscado = userService.getUserById(idInexistente);

      // Assert
      expect(buscado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('deve retornar true ao desativar usuário comum', () => {
      // Arrange
      const comum = criar(umUsuario({ isAdmin: false }));

      // Act
      const resultado = userService.deactivateUser(comum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    test('deve marcar usuário comum como inativo após desativação', () => {
      // Arrange
      const comum = criar(umUsuario({ isAdmin: false }));

      // Act
      userService.deactivateUser(comum.id);

      // Assert
      expect(userService.getUserById(comum.id).status).toBe('inativo');
    });

    test('deve retornar false ao tentar desativar administrador', () => {
      // Arrange
      const admin = criar(umUsuario({ isAdmin: true }));

      // Act
      const resultado = userService.deactivateUser(admin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    test('deve manter administrador ativo após tentativa de desativação', () => {
      // Arrange
      const admin = criar(umUsuario({ isAdmin: true }));

      // Act
      userService.deactivateUser(admin.id);

      // Assert
      expect(userService.getUserById(admin.id).status).toBe('ativo');
    });

    test('deve retornar false ao desativar usuário inexistente', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('deve incluir id, nome e status de cada usuário cadastrado', () => {
      // Arrange
      const alice = criar(umUsuario({ nome: 'Alice', email: 'alice@email.com' }));
      const bob = criar(umUsuario({ nome: 'Bob', email: 'bob@email.com' }));

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining(alice.id));
      expect(relatorio).toEqual(expect.stringContaining('Alice'));
      expect(relatorio).toEqual(expect.stringContaining(bob.id));
      expect(relatorio).toEqual(expect.stringContaining('Bob'));
      expect(relatorio).toEqual(expect.stringContaining('ativo'));
    });

    test('deve exibir o título do relatório', () => {
      // Arrange
      criar(umUsuario());

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(/^--- Relatório de Usuários ---/);
    });

    test('deve informar que não há usuários quando o banco está vazio', () => {
      // Arrange (banco limpo pelo beforeEach)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining('Nenhum usuário cadastrado'));
    });
  });
});
